import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS_CAIXA } from "@/lib/caixa/validacoes";

/** O que alguém disse que é um movimento "Sem dono" do banco. */
export const classificarSchema = z.discriminatedUnion("acao", [
  z.object({ acao: z.literal("RECEBER"), contaReceberId: z.string().min(1) }),
  z.object({ acao: z.literal("PAGAR"), contaPagarId: z.string().min(1) }),
  z.object({ acao: z.literal("JA_LANCADO"), lancamentoId: z.string().min(1) }),
  z.object({
    acao: z.literal("LANCAR"),
    categoria: z.enum(CATEGORIAS_CAIXA),
    descricao: z.string().trim().min(1, "Descreva"),
    obraId: z.string().optional().nullable(),
    socioId: z.string().optional().nullable(),
    favorecido: z.string().optional().nullable(),
  }),
  z.object({ acao: z.literal("IGNORAR"), motivo: z.string().trim().min(3, "Escreva o motivo") }),
]);
export type Classificacao = z.infer<typeof classificarSchema>;

const quem = (u?: string) => (u ? ` · por ${u}` : "");

export async function classificar(movId: string, c: Classificacao, usuario?: string) {
  return prisma.$transaction(async (tx) => {
    const m = await tx.movimentoBanco.findUniqueOrThrow({ where: { id: movId } });
    if (m.situacao !== "SEM_DONO") throw new Error("Este movimento já foi resolvido.");

    if (c.acao === "RECEBER" || c.acao === "PAGAR") {
      if (c.acao === "RECEBER" && m.tipo !== "ENTRADA") throw new Error("Saída de dinheiro não pode baixar conta a receber.");
      if (c.acao === "PAGAR" && m.tipo !== "SAIDA") throw new Error("Entrada de dinheiro não pode baixar conta a pagar.");
      const conta =
        c.acao === "RECEBER"
          ? await tx.contaReceber.findUniqueOrThrow({ where: { id: c.contaReceberId } })
          : await tx.contaPagar.findUniqueOrThrow({ where: { id: c.contaPagarId } });
      if (conta.status === "PAGA") throw new Error("Essa conta já está paga.");
      const novoPago = Math.round((conta.valorPago + m.valor) * 100) / 100;
      const sobra = Math.round((novoPago - conta.valor) * 100) / 100;
      const nota =
        `Baixa pelo extrato do Inter (${m.data.toLocaleDateString("pt-BR", { timeZone: "America/Maceio" })}): R$ ${m.valor.toFixed(2)}` +
        (sobra > 0 ? ` · R$ ${sobra.toFixed(2)} a mais que a conta, conferir` : "");
      const dados = {
        valorPago: novoPago,
        status: novoPago >= conta.valor ? "PAGA" : "PARCIAL",
        formaPagamento: "Inter",
        observacoes: [nota, conta.observacoes].filter(Boolean).join("\n"),
      };
      if (c.acao === "RECEBER") await tx.contaReceber.update({ where: { id: conta.id }, data: dados });
      else await tx.contaPagar.update({ where: { id: conta.id }, data: dados });
      return tx.movimentoBanco.update({
        where: { id: m.id },
        data: {
          situacao: "RECONHECIDO",
          categoria: c.acao === "RECEBER" ? "RECEBIMENTO" : null,
          ...(c.acao === "RECEBER" ? { contaReceberId: conta.id } : { contaPagarId: conta.id }),
          explicacao: `${conta.descricao}${quem(usuario)}`,
        },
      });
    }

    if (c.acao === "JA_LANCADO") {
      const l = await tx.lancamentoCaixa.findUniqueOrThrow({ where: { id: c.lancamentoId } });
      const usado = await tx.movimentoBanco.findFirst({ where: { lancamentoId: l.id } });
      if (usado) throw new Error("Esse lançamento já está ligado a outro movimento do banco.");
      return tx.movimentoBanco.update({
        where: { id: m.id },
        data: { situacao: "RECONHECIDO", categoria: l.categoria, lancamentoId: l.id, explicacao: `Já estava lançado: ${l.descricao}${quem(usuario)}` },
      });
    }

    if (c.acao === "LANCAR") {
      const l = await tx.lancamentoCaixa.create({
        data: {
          data: m.data,
          tipo: m.tipo,
          valor: m.valor,
          descricao: c.descricao,
          categoria: c.categoria,
          contaId: m.contaId,
          obraId: c.obraId || null,
          socioId: c.socioId || null,
          favorecido: c.favorecido || null,
          forma: "Inter",
          fonte: `extrato do Inter: ${m.titulo}${quem(usuario)}`,
        },
      });
      return tx.movimentoBanco.update({
        where: { id: m.id },
        data: { situacao: "RECONHECIDO", categoria: c.categoria, lancamentoId: l.id, explicacao: `${c.descricao}${quem(usuario)}` },
      });
    }

    return tx.movimentoBanco.update({
      where: { id: m.id },
      data: { situacao: "IGNORADO", explicacao: `${c.motivo}${quem(usuario)}` },
    });
  });
}

/** Sugestões para o movimento: contas abertas de valor parecido e lançamentos já feitos no mesmo valor. */
export async function sugestoes(movId: string) {
  const m = await prisma.movimentoBanco.findUniqueOrThrow({ where: { id: movId } });
  const perto = { gte: new Date(m.data.getTime() - 7 * 864e5), lte: new Date(m.data.getTime() + 7 * 864e5) };
  const ligados = new Set(
    (await prisma.movimentoBanco.findMany({ where: { lancamentoId: { not: null } }, select: { lancamentoId: true } })).map((x) => x.lancamentoId),
  );
  const lancamentos = (
    await prisma.lancamentoCaixa.findMany({
      where: { tipo: m.tipo, valor: { gte: m.valor - 0.01, lte: m.valor + 0.01 }, data: perto },
      select: { id: true, data: true, descricao: true, categoria: true, valor: true },
    })
  ).filter((l) => !ligados.has(l.id));
  const dist = (v: number) => Math.abs(v - m.valor);
  if (m.tipo === "ENTRADA") {
    const contas = await prisma.contaReceber.findMany({
      where: { status: { in: ["ABERTA", "PARCIAL"] } },
      select: { id: true, descricao: true, valor: true, valorPago: true, vencimento: true, cliente: { select: { nome: true } } },
    });
    return {
      movimento: m,
      lancamentos,
      contas: contas
        .map((c) => ({ id: c.id, descricao: c.descricao, quem: c.cliente.nome, aberto: c.valor - c.valorPago, vencimento: c.vencimento }))
        .sort((a, b) => dist(a.aberto) - dist(b.aberto))
        .slice(0, 15),
    };
  }
  const contas = await prisma.contaPagar.findMany({
    where: { status: { in: ["ABERTA", "PARCIAL"] } },
    select: { id: true, descricao: true, valor: true, valorPago: true, vencimento: true, fornecedor: { select: { nome: true } } },
  });
  return {
    movimento: m,
    lancamentos,
    contas: contas
      .map((c) => ({ id: c.id, descricao: c.descricao, quem: c.fornecedor?.nome ?? "", aberto: c.valor - c.valorPago, vencimento: c.vencimento }))
      .sort((a, b) => dist(a.aberto) - dist(b.aberto))
      .slice(0, 15),
  };
}
