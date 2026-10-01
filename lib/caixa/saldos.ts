import { prisma } from "@/lib/prisma";

/**
 * Saldo de cada conta = último saldo conferido + o que entrou e saiu depois dele.
 * Sem saldo conferido, soma o extrato inteiro da conta.
 */
export async function saldosDasContas() {
  const contas = await prisma.contaFinanceira.findMany({
    where: { ativa: true },
    orderBy: { nome: "asc" },
    include: { saldos: { orderBy: { data: "desc" }, take: 1 } },
  });

  return Promise.all(
    contas.map(async (c) => {
      const base = c.saldos[0] ?? null;
      const depois = base ? { gt: base.data } : undefined;
      const [ent, sai] = await Promise.all([
        prisma.lancamentoCaixa.aggregate({ _sum: { valor: true }, where: { contaId: c.id, tipo: "ENTRADA", ...(depois ? { data: depois } : {}) } }),
        prisma.lancamentoCaixa.aggregate({ _sum: { valor: true }, where: { contaId: c.id, tipo: "SAIDA", ...(depois ? { data: depois } : {}) } }),
      ]);
      const saldo = (base?.saldo ?? 0) + (ent._sum.valor ?? 0) - (sai._sum.valor ?? 0);
      return {
        id: c.id,
        nome: c.nome,
        banco: c.banco,
        observacoes: c.observacoes,
        saldo,
        conferidoEm: base?.data ?? null,
        saldoConferido: base?.saldo ?? null,
      };
    })
  );
}
