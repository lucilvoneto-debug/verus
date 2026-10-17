import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { categoriaDaContaPagar } from "@/lib/caixa/extrato";
import { ESCOPOS, interChamar } from "./cliente";

/**
 * Pagar fornecedor pelo Inter (boleto ou PIX).
 * O sistema só manda o pedido. A baixa da conta a pagar acontece quando o banco
 * confirma (resposta "pago" ou a saída aparecer no extrato) — pedido aguardando
 * aprovação no app do Inter NÃO baixa nada.
 */

const VIVOS = ["ENVIADO", "AGUARDANDO_APROVACAO", "AGENDADO", "PAGO"];

function traduzir(resp: Record<string, unknown>): string {
  const t = `${resp.statusPagamento ?? ""} ${resp.tipoRetorno ?? ""} ${resp.status ?? ""}`.toUpperCase();
  if (/APROVA/.test(t)) return "AGUARDANDO_APROVACAO";
  if (/AGENDAD/.test(t)) return "AGENDADO";
  if (/CANCEL|REPROV|RECUS|FALH|ERRO/.test(t)) return "RECUSADO";
  if (/PROCESSAD|REALIZAD|PAGO|EFETIVAD|CONCLU/.test(t)) return "PAGO";
  return "ENVIADO";
}

export async function pagarPeloInter(p: { contaPagarId: string; tipo: "BOLETO" | "PIX"; destino: string; usuario?: string }) {
  const conta = await prisma.contaPagar.findUnique({ where: { id: p.contaPagarId } });
  if (!conta) throw new Error("Conta a pagar não encontrada.");
  if (conta.status === "PAGA") throw new Error("Esta conta já está paga.");
  const andamento = await prisma.pagamentoBanco.findFirst({ where: { contaPagarId: conta.id, status: { in: VIVOS } } });
  if (andamento) throw new Error(`Já existe um pagamento desta conta no banco (${andamento.status.toLowerCase().replace(/_/g, " ")}).`);

  const valor = Math.round((conta.valor - conta.valorPago) * 100) / 100;
  if (valor <= 0) throw new Error("Nada em aberto nesta conta.");
  const destino = p.tipo === "BOLETO" ? p.destino.replace(/\D/g, "") : p.destino.trim();
  if (p.tipo === "BOLETO" && ![44, 47, 48].includes(destino.length)) throw new Error("Código de barras inválido: confira os números do boleto.");
  if (p.tipo === "PIX" && destino.length < 5) throw new Error("Chave PIX inválida.");

  const idempotente = crypto.randomUUID();
  const reg = await prisma.pagamentoBanco.create({
    data: { contaPagarId: conta.id, tipo: p.tipo, destino, valor, idempotente, status: "ENVIADO", criadoPor: p.usuario ?? null },
  });

  let resp: Record<string, unknown>;
  try {
    resp =
      p.tipo === "BOLETO"
        ? await interChamar("POST", "/banking/v2/pagamento", {
            escopo: ESCOPOS.PAGA_BOLETO,
            corpo: {
              codBarraLinhaDigitavel: destino,
              valorPagar: valor.toFixed(2),
              dataVencimento: conta.vencimento.toISOString().slice(0, 10),
            },
          })
        : await interChamar("POST", "/banking/v2/pix", {
            escopo: ESCOPOS.PAGA_PIX,
            corpo: { valor: valor.toFixed(2), descricao: conta.descricao.slice(0, 140), destinatario: { tipo: "CHAVE", chave: destino } },
            cabecalhos: { "x-id-idempotente": idempotente },
          });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.pagamentoBanco.update({ where: { id: reg.id }, data: { status: "RECUSADO", resposta: msg.slice(0, 2000) } });
    throw new Error(`O banco recusou: ${msg}`);
  }

  const status = traduzir(resp);
  await prisma.pagamentoBanco.update({
    where: { id: reg.id },
    data: {
      status,
      codigoBanco: String(resp.codigoTransacao ?? resp.codigoSolicitacao ?? "") || null,
      resposta: JSON.stringify(resp).slice(0, 4000),
    },
  });
  if (status === "PAGO") await darBaixa(reg.id);
  return prisma.pagamentoBanco.findUniqueOrThrow({ where: { id: reg.id } });
}

async function darBaixa(pagamentoId: string) {
  await prisma.$transaction(async (tx) => {
    const trava = await tx.pagamentoBanco.updateMany({ where: { id: pagamentoId, baixaFeita: false }, data: { baixaFeita: true, status: "PAGO" } });
    if (!trava.count) return;
    const pg = await tx.pagamentoBanco.findUniqueOrThrow({ where: { id: pagamentoId }, include: { contaPagar: true } });
    const conta = pg.contaPagar;
    const novoPago = Math.round((conta.valorPago + pg.valor) * 100) / 100;
    await tx.contaPagar.update({
      where: { id: conta.id },
      data: {
        valorPago: novoPago,
        status: novoPago >= conta.valor ? "PAGA" : "PARCIAL",
        formaPagamento: pg.tipo === "PIX" ? "PIX (Inter)" : "Boleto (Inter)",
        observacoes: [`Pago pelo Banco Inter: R$ ${pg.valor.toFixed(2)}`, conta.observacoes].filter(Boolean).join("\n"),
      },
    });
  });
}

/**
 * Saída no extrato com o mesmo valor de um pagamento mandado pelo sistema
 * (depois do pedido) = o dinheiro saiu. Liga o movimento e dá baixa.
 */
export async function baixarPagamentoPeloExtrato(movId: string): Promise<boolean> {
  const m = await prisma.movimentoBanco.findUniqueOrThrow({ where: { id: movId } });
  if (m.tipo !== "SAIDA") return false;
  const candidatos = await prisma.pagamentoBanco.findMany({
    where: { status: { in: VIVOS }, createdAt: { lte: new Date(m.data.getTime() + 864e5) } },
    include: { contaPagar: { select: { descricao: true, categoria: true } } },
    orderBy: { createdAt: "asc" },
  });
  const usados = new Set(
    (await prisma.movimentoBanco.findMany({ where: { pagamentoId: { in: candidatos.map((c) => c.id) } }, select: { pagamentoId: true } })).map((x) => x.pagamentoId),
  );
  const pg = candidatos.find(
    (c) => !usados.has(c.id) && Math.round(c.valor * 100) === Math.round(m.valor * 100) && c.createdAt.getTime() >= m.data.getTime() - 2 * 864e5,
  );
  if (!pg) return false;
  await darBaixa(pg.id);
  await prisma.movimentoBanco.update({
    where: { id: m.id },
    data: {
      situacao: "RECONHECIDO",
      categoria: categoriaDaContaPagar(pg.contaPagar.categoria, pg.contaPagar.descricao),
      contaPagarId: pg.contaPagarId,
      pagamentoId: pg.id,
      explicacao: `Pagamento mandado pelo sistema · ${pg.contaPagar.descricao}`,
    },
  });
  return true;
}

/** Marca como cancelado no sistema um pedido que não foi aprovado no app do Inter. */
export async function desistirPagamento(id: string) {
  const pg = await prisma.pagamentoBanco.findUniqueOrThrow({ where: { id } });
  if (pg.baixaFeita || pg.status === "PAGO") throw new Error("Este pagamento já saiu da conta.");
  return prisma.pagamentoBanco.update({ where: { id }, data: { status: "CANCELADO" } });
}
