import { prisma } from "@/lib/prisma";
import { ESCOPOS, interChamar } from "./cliente";

/**
 * Boleto com PIX (Cobrança v3 do Inter) para conta a receber.
 * Regra de dinheiro: boleto emitido nunca é apagado nem sobrescrito. Para mudar
 * valor ou vencimento, cancela no banco e emite outro — os dois ficam no histórico.
 */

const VIVAS = ["EM_PROCESSAMENTO", "A_RECEBER", "ATRASADO"];
export const cobrancaViva = (situacao: string) => VIVAS.includes(situacao);

const so = (s?: string | null) => (s ?? "").replace(/\D/g, "");
const corta = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s);

type Detalhe = {
  cobranca?: { situacao?: string; valorTotalRecebido?: number | string; dataSituacao?: string; origemRecebimento?: string };
  boleto?: { nossoNumero?: string; linhaDigitavel?: string };
  pix?: { pixCopiaECola?: string };
};

export async function gerarCobranca(p: { contaReceberId: string; vencimento: string; usuario?: string }) {
  const conta = await prisma.contaReceber.findUnique({ where: { id: p.contaReceberId }, include: { cliente: true } });
  if (!conta) throw new Error("Conta a receber não encontrada.");
  if (conta.status === "PAGA") throw new Error("Esta conta já está paga.");
  const viva = await prisma.cobrancaBanco.findFirst({ where: { contaReceberId: conta.id, situacao: { in: VIVAS } } });
  if (viva) throw new Error("Já existe um boleto em aberto para esta conta. Cancele o atual antes de gerar outro.");

  const valor = Math.round((conta.valor - conta.valorPago) * 100) / 100;
  if (valor < 2.5) throw new Error("O Inter só emite boleto a partir de R$ 2,50.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.vencimento)) throw new Error("Vencimento inválido.");
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Maceio" });
  if (p.vencimento < hoje) throw new Error("O vencimento do boleto não pode ser no passado.");

  const c = conta.cliente;
  const doc = so(c.documento);
  const faltando = [
    doc.length !== 11 && doc.length !== 14 ? "CPF/CNPJ" : "",
    so(c.cep).length !== 8 ? "CEP" : "",
    !c.logradouro?.trim() ? "rua" : "",
    !c.bairro?.trim() ? "bairro" : "",
    !c.cidade?.trim() ? "cidade" : "",
    !c.uf?.trim() ? "estado" : "",
  ].filter(Boolean);
  if (faltando.length) throw new Error(`O cadastro de ${c.nome} está sem: ${faltando.join(", ")}. O banco exige para emitir boleto.`);

  let tel = so(c.whatsapp || c.telefone);
  if (tel.length >= 12 && tel.startsWith("55")) tel = tel.slice(2);
  const seuNumero = `VR${Date.now().toString(36).toUpperCase()}`.slice(0, 15);

  const criada = await interChamar<{ codigoSolicitacao: string }>("POST", "/cobranca/v3/cobrancas", {
    escopo: ESCOPOS.COBRANCA,
    corpo: {
      seuNumero,
      valorNominal: valor,
      dataVencimento: p.vencimento,
      numDiasAgenda: 30,
      formasDeRecebimento: ["BOLETO", "PIX"],
      pagador: {
        cpfCnpj: doc,
        tipoPessoa: doc.length === 14 ? "JURIDICA" : "FISICA",
        nome: corta(c.nome, 100),
        email: c.email ? corta(c.email, 50) : undefined,
        ddd: tel.length >= 10 ? tel.slice(0, 2) : undefined,
        telefone: tel.length >= 10 ? tel.slice(2, 11) : undefined,
        cep: so(c.cep),
        endereco: corta(c.logradouro!.trim(), 100),
        numero: corta(so(c.numero) || "0", 10),
        complemento: c.complemento ? corta(c.complemento, 30) : undefined,
        bairro: corta(c.bairro!.trim(), 60),
        cidade: corta(c.cidade!.trim(), 60),
        uf: c.uf!.trim().toUpperCase().slice(0, 2),
      },
      mensagem: { linha1: corta(`Verus Impermeabilizacoes - ${conta.descricao}`, 78) },
    },
  });

  const cob = await prisma.cobrancaBanco.create({
    data: {
      contaReceberId: conta.id,
      codigoSolicitacao: criada.codigoSolicitacao,
      seuNumero,
      valor,
      vencimento: new Date(`${p.vencimento}T12:00:00-03:00`),
      criadoPor: p.usuario ?? null,
    },
  });

  // Linha digitável e PIX ficam prontos em alguns segundos.
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const at = await atualizarCobranca(cob.id);
    if (at.linhaDigitavel || at.pixCopiaECola) return at;
  }
  return prisma.cobrancaBanco.findUniqueOrThrow({ where: { id: cob.id } });
}

/** Consulta o banco e, se foi pago, dá baixa na conta a receber (uma vez só). */
export async function atualizarCobranca(id: string) {
  const cob = await prisma.cobrancaBanco.findUniqueOrThrow({ where: { id } });
  const d = await interChamar<Detalhe>("GET", `/cobranca/v3/cobrancas/${cob.codigoSolicitacao}`, { escopo: ESCOPOS.COBRANCA });
  const situacao = d.cobranca?.situacao ?? cob.situacao;
  const recebido = d.cobranca?.valorTotalRecebido != null && d.cobranca.valorTotalRecebido !== "" ? Number(d.cobranca.valorTotalRecebido) : null;
  const atual = await prisma.cobrancaBanco.update({
    where: { id },
    data: {
      situacao,
      linhaDigitavel: d.boleto?.linhaDigitavel ?? cob.linhaDigitavel,
      nossoNumero: d.boleto?.nossoNumero ?? cob.nossoNumero,
      pixCopiaECola: d.pix?.pixCopiaECola ?? cob.pixCopiaECola,
      consultadoEm: new Date(),
      ...(situacao === "RECEBIDO"
        ? {
            valorRecebido: recebido ?? cob.valor,
            recebidoEm: d.cobranca?.dataSituacao ? new Date(`${d.cobranca.dataSituacao.slice(0, 10)}T12:00:00-03:00`) : new Date(),
            origemRecebimento: d.cobranca?.origemRecebimento ?? null,
          }
        : {}),
    },
  });
  if (situacao === "RECEBIDO" && !atual.baixaFeita) await darBaixa(atual.id);
  return prisma.cobrancaBanco.findUniqueOrThrow({ where: { id } });
}

async function darBaixa(cobrancaId: string) {
  await prisma.$transaction(async (tx) => {
    // Trava: só um processo marca a baixa.
    const trava = await tx.cobrancaBanco.updateMany({ where: { id: cobrancaId, baixaFeita: false }, data: { baixaFeita: true } });
    if (!trava.count) return;
    const cob = await tx.cobrancaBanco.findUniqueOrThrow({ where: { id: cobrancaId }, include: { contaReceber: true } });
    const conta = cob.contaReceber;
    const pago = cob.valorRecebido ?? cob.valor;
    const novoPago = Math.round((conta.valorPago + pago) * 100) / 100;
    const sobra = Math.round((novoPago - conta.valor) * 100) / 100;
    const forma = cob.origemRecebimento === "PIX" ? "PIX (Inter)" : "Boleto (Inter)";
    const nota = `Pago ${forma} em ${cob.recebidoEm?.toLocaleDateString("pt-BR", { timeZone: "America/Maceio" })}: R$ ${pago.toFixed(2)}` +
      (sobra > 0 ? ` · pagou R$ ${sobra.toFixed(2)} a mais (crédito do cliente, conferir)` : "");
    await tx.contaReceber.update({
      where: { id: conta.id },
      data: {
        valorPago: novoPago,
        status: novoPago >= conta.valor ? "PAGA" : "PARCIAL",
        formaPagamento: forma,
        observacoes: [nota, conta.observacoes].filter(Boolean).join("\n"),
      },
    });
  });
}

/** Atualiza os boletos em aberto (no máximo a cada 10 min cada um). */
export async function atualizarCobrancasAbertas() {
  const limite = new Date(Date.now() - 10 * 60_000);
  const abertas = await prisma.cobrancaBanco.findMany({
    where: { situacao: { in: VIVAS }, OR: [{ consultadoEm: null }, { consultadoEm: { lt: limite } }] },
    orderBy: { consultadoEm: "asc" },
    take: 30,
  });
  let pagas = 0;
  for (const c of abertas) {
    try {
      const at = await atualizarCobranca(c.id);
      if (at.situacao === "RECEBIDO") pagas++;
    } catch (e) {
      console.error("[inter] atualizar cobrança", c.id, e);
    }
  }
  return { consultadas: abertas.length, pagas };
}

export async function cancelarCobranca(id: string, motivo: string) {
  const cob = await prisma.cobrancaBanco.findUniqueOrThrow({ where: { id } });
  if (!cobrancaViva(cob.situacao)) throw new Error("Este boleto não está em aberto.");
  const m = motivo.trim();
  if (m.length < 3) throw new Error("Escreva o motivo do cancelamento.");
  // O Inter aceita no máximo 50 caracteres; o motivo inteiro fica aqui.
  await interChamar("POST", `/cobranca/v3/cobrancas/${cob.codigoSolicitacao}/cancelar`, {
    escopo: ESCOPOS.COBRANCA,
    corpo: { motivoCancelamento: m.slice(0, 50) },
  });
  return prisma.cobrancaBanco.update({ where: { id }, data: { situacao: "CANCELADO", canceladaEm: new Date(), motivoCancelamento: m } });
}

export async function pdfCobranca(id: string): Promise<Buffer> {
  const cob = await prisma.cobrancaBanco.findUniqueOrThrow({ where: { id } });
  const r = await interChamar<{ pdf?: string }>("GET", `/cobranca/v3/cobrancas/${cob.codigoSolicitacao}/pdf`, { escopo: ESCOPOS.COBRANCA });
  if (!r.pdf) throw new Error("O banco não devolveu o PDF.");
  return Buffer.from(r.pdf, "base64");
}
