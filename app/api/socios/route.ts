import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS_SOCIO } from "@/lib/caixa/validacoes";

export const dynamic = "force-dynamic";

/**
 * Quanto cada sócio colocou e tirou, o resultado da operação no período
 * e o acerto entre eles pela participação do contrato social.
 */
export async function GET() {
  const [socios, movimentos, operacao] = await Promise.all([
    prisma.socio.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
    prisma.lancamentoCaixa.findMany({
      where: { socioId: { not: null } },
      orderBy: { data: "desc" },
      include: { conta: { select: { nome: true } }, obra: { select: { nome: true } } },
    }),
    prisma.lancamentoCaixa.groupBy({
      by: ["tipo"],
      _sum: { valor: true },
      where: { categoria: { notIn: [...CATEGORIAS_SOCIO] } },
    }),
  ]);

  const entradas = operacao.find((o) => o.tipo === "ENTRADA")?._sum.valor ?? 0;
  const saidas = operacao.find((o) => o.tipo === "SAIDA")?._sum.valor ?? 0;
  const resultado = entradas - saidas;

  const totais = socios.map((s) => {
    const meus = movimentos.filter((m) => m.socioId === s.id);
    // Só retirada/aporte mexe no acerto. Gasolina ou material pagos ao sócio são despesa da obra
    // (entram no resultado) e aparecem à parte como "despesas reembolsadas".
    const retirou = meus.filter((m) => m.categoria === "RETIRADA_SOCIO").reduce((t, m) => t + m.valor, 0);
    const aportou = meus.filter((m) => m.categoria === "APORTE_SOCIO").reduce((t, m) => t + m.valor, 0);
    const reembolsos = meus
      .filter((m) => m.tipo === "SAIDA" && m.categoria !== "RETIRADA_SOCIO")
      .reduce((t, m) => t + m.valor, 0);
    const direito = s.participacao != null ? resultado * s.participacao : null;
    return { ...s, aportou, retirou, reembolsos, direito, saldo: direito != null ? direito + aportou - retirou : null };
  });

  return NextResponse.json({ socios: totais, movimentos, resultado: { entradas, saidas, resultado } });
}
