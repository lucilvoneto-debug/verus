import { prisma } from "@/lib/prisma";
import { ESCOPOS, interChamar } from "./cliente";
import { baixarPagamentoPeloExtrato } from "./pagamento";

/**
 * Puxa saldo e extrato do Inter. Cada movimento vira uma linha de MovimentoBanco
 * (sem duplicar: chave é o idTransacao do banco). O movimento NÃO entra no extrato
 * da empresa sozinho — só quando o sistema tem certeza do que é (boleto que ele
 * mesmo emitiu, pagamento que ele mesmo mandou, tarifa do banco) ou quando alguém
 * diz o que é na tela. O resto fica "Sem dono".
 */

type ItemInter = {
  idTransacao?: string;
  dataEntrada?: string;
  dataInclusao?: string;
  dataTransacao?: string;
  tipoTransacao?: string;
  tipoOperacao?: string;
  valor?: number | string;
  titulo?: string;
  descricao?: string;
};

const POR_PAGINA = 60; // o Inter recusa mais que 60

const diaMaceio = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "America/Maceio" });
/** Data só-dia do banco → meio-dia de Maceió, igual aos lançamentos (lib/caixa/validacoes). */
const meioDia = (dia: string) => new Date(`${dia.slice(0, 10)}T12:00:00-03:00`);

function chave(i: ItemInter, dia: string, valor: number, tipo: string) {
  if (i.idTransacao) return `INTER:${i.idTransacao}`;
  const texto = `${i.titulo ?? ""}${i.descricao ?? ""}`.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 40);
  return `INTER:${dia}:${tipo}:${Math.round(valor * 100)}:${texto}`;
}

export async function contaDoInter() {
  const integ = await prisma.integracaoBanco.findUnique({ where: { banco: "INTER" } });
  if (integ?.contaId) {
    const c = await prisma.contaFinanceira.findUnique({ where: { id: integ.contaId } });
    if (c) return c;
  }
  // Conta "Banco Inter PJ (Verus)" cadastrada em 01/10/2026.
  const c = await prisma.contaFinanceira.findFirst({ where: { banco: { contains: "Inter", mode: "insensitive" }, ativa: true } });
  if (!c) throw new Error("Não existe conta do Inter em Contas e saldos. Crie a conta com banco \"Inter\".");
  return c;
}

export async function sincronizarInter(opcoes: { dias?: number } = {}) {
  const integ = await prisma.integracaoBanco.findUnique({ where: { banco: "INTER" } });
  if (!integ?.ativa) throw new Error("Banco Inter ainda não ligado.");
  const conta = await contaDoInter();

  const agora = new Date();
  const ultimo = integ.extratoSyncEm;
  const dias = opcoes.dias ?? (ultimo ? Math.min(30, Math.ceil((agora.getTime() - ultimo.getTime()) / 864e5) + 5) : 30);
  const de = diaMaceio(new Date(agora.getTime() - dias * 864e5));
  const ate = diaMaceio(agora);

  const saldoResp = await interChamar<{ disponivel?: number }>("GET", "/banking/v2/saldo", { escopo: ESCOPOS.EXTRATO });
  const saldo = Number(saldoResp.disponivel ?? 0);

  const itens: ItemInter[] = [];
  for (let pagina = 0; pagina < 50; pagina++) {
    const r = await interChamar<{ totalPaginas?: number; transacoes?: ItemInter[] }>("GET", "/banking/v2/extrato/completo", {
      escopo: ESCOPOS.EXTRATO,
      query: { dataInicio: de, dataFim: ate, pagina, tamanhoPagina: POR_PAGINA },
    });
    itens.push(...(r.transacoes ?? []));
    if (pagina + 1 >= (r.totalPaginas ?? 1)) break;
  }

  let novos = 0;
  let reconhecidos = 0;
  for (const i of itens) {
    const dia = String(i.dataEntrada ?? i.dataInclusao ?? i.dataTransacao ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) continue;
    const valor = Math.abs(Number(i.valor ?? 0));
    if (!valor) continue;
    const tipo = String(i.tipoOperacao ?? "").toUpperCase().startsWith("D") ? "SAIDA" : "ENTRADA";
    const idBanco = chave(i, dia, valor, tipo);
    const existe = await prisma.movimentoBanco.findUnique({ where: { idBanco } });
    if (existe) continue;
    const titulo = (i.titulo || i.tipoTransacao || "Movimento").trim();
    const mov = await prisma.movimentoBanco.create({
      data: {
        contaId: conta.id,
        idBanco,
        data: meioDia(dia),
        tipo,
        valor,
        titulo,
        descricao: [i.tipoTransacao, i.descricao].filter(Boolean).join(" · ") || null,
      },
    });
    novos++;
    if (await reconhecer(mov.id)) reconhecidos++;
  }

  // Saldo do banco vira o "saldo conferido" de hoje da conta (uma linha por dia, a de hoje é atualizada).
  const inicioHoje = new Date(`${ate}T00:00:00-03:00`);
  const doDia = await prisma.saldoConta.findFirst({ where: { contaId: conta.id, fonte: "Banco Inter (automático)", data: { gte: inicioHoje } } });
  if (doDia) await prisma.saldoConta.update({ where: { id: doDia.id }, data: { saldo, data: agora } });
  else await prisma.saldoConta.create({ data: { contaId: conta.id, data: agora, saldo, fonte: "Banco Inter (automático)" } });

  await prisma.integracaoBanco.update({
    where: { banco: "INTER" },
    data: { saldo, saldoEm: agora, extratoSyncEm: agora, ultimoErro: null, contaId: conta.id },
  });

  return { de, ate, lidos: itens.length, novos, reconhecidos, saldo };
}

/** Só reconhece o que tem certeza. Devolve true se reconheceu. */
async function reconhecer(movId: string): Promise<boolean> {
  const m = await prisma.movimentoBanco.findUnique({ where: { id: movId } });
  if (!m || m.situacao !== "SEM_DONO") return false;
  const centavos = Math.round(m.valor * 100);
  const janela = { gte: new Date(m.data.getTime() - 3 * 864e5), lte: new Date(m.data.getTime() + 3 * 864e5) };

  if (m.tipo === "ENTRADA") {
    const cobs = await prisma.cobrancaBanco.findMany({
      where: { situacao: "RECEBIDO", recebidoEm: janela },
      include: { contaReceber: { select: { descricao: true } } },
    });
    const ja = new Set((await prisma.movimentoBanco.findMany({ where: { cobrancaId: { in: cobs.map((c) => c.id) } }, select: { cobrancaId: true } })).map((x) => x.cobrancaId));
    const c = cobs.find((x) => !ja.has(x.id) && Math.round((x.valorRecebido ?? x.valor) * 100) === centavos);
    if (c) {
      await prisma.movimentoBanco.update({
        where: { id: m.id },
        data: { situacao: "RECONHECIDO", categoria: "RECEBIMENTO", contaReceberId: c.contaReceberId, cobrancaId: c.id, explicacao: `Boleto/PIX emitido pelo sistema · ${c.contaReceber.descricao}` },
      });
      return true;
    }
    return false;
  }

  if (await baixarPagamentoPeloExtrato(m.id)) return true;

  if (/tarifa/i.test(`${m.titulo} ${m.descricao ?? ""}`)) {
    const l = await prisma.lancamentoCaixa.create({
      data: { data: m.data, tipo: "SAIDA", valor: m.valor, descricao: m.titulo, categoria: "IMPOSTO_TAXA", contaId: m.contaId, favorecido: "Banco Inter", forma: "Débito em conta", fonte: "Banco Inter (automático)" },
    });
    await prisma.movimentoBanco.update({ where: { id: m.id }, data: { situacao: "RECONHECIDO", categoria: "IMPOSTO_TAXA", lancamentoId: l.id, explicacao: "Tarifa do banco" } });
    return true;
  }
  return false;
}
