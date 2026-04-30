import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");

  const startDate = inicio ? new Date(inicio) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = fim ? new Date(fim) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  const [recebidas, pagas, futuroReceber, futuroPagar] = await Promise.all([
    prisma.contaReceber.findMany({
      where: {
        status: { in: ["PAGA", "PARCIAL"] },
        updatedAt: { gte: startDate, lte: endDate },
        valorPago: { gt: 0 },
      },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.contaPagar.findMany({
      where: {
        status: { in: ["PAGA", "PARCIAL"] },
        updatedAt: { gte: startDate, lte: endDate },
        valorPago: { gt: 0 },
      },
      include: { fornecedor: { select: { id: true, nome: true } } },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.contaReceber.findMany({
      where: {
        status: { in: ["ABERTA", "PARCIAL"] },
        vencimento: { gte: startDate, lte: endDate },
      },
      include: { cliente: { select: { id: true, nome: true } } },
      orderBy: { vencimento: "asc" },
    }),
    prisma.contaPagar.findMany({
      where: {
        status: { in: ["ABERTA", "PARCIAL"] },
        vencimento: { gte: startDate, lte: endDate },
      },
      include: { fornecedor: { select: { id: true, nome: true } } },
      orderBy: { vencimento: "asc" },
    }),
  ]);

  const totalEntradas = recebidas.reduce((s, r) => s + r.valorPago, 0);
  const totalSaidas = pagas.reduce((s, r) => s + r.valorPago, 0);
  const previstoEntradas = futuroReceber.reduce((s, r) => s + (r.valor - r.valorPago), 0);
  const previstoSaidas = futuroPagar.reduce((s, r) => s + (r.valor - r.valorPago), 0);

  const movimentos = [
    ...recebidas.map((r) => ({
      id: r.id,
      data: r.updatedAt,
      tipo: "ENTRADA" as const,
      descricao: r.descricao,
      contraparte: r.cliente.nome,
      valor: r.valorPago,
      status: "REALIZADO" as const,
    })),
    ...pagas.map((r) => ({
      id: r.id,
      data: r.updatedAt,
      tipo: "SAIDA" as const,
      descricao: r.descricao,
      contraparte: r.fornecedor?.nome ?? r.categoria,
      valor: r.valorPago,
      status: "REALIZADO" as const,
    })),
    ...futuroReceber.map((r) => ({
      id: `prev-${r.id}`,
      data: r.vencimento,
      tipo: "ENTRADA" as const,
      descricao: r.descricao,
      contraparte: r.cliente.nome,
      valor: r.valor - r.valorPago,
      status: "PREVISTO" as const,
    })),
    ...futuroPagar.map((r) => ({
      id: `prev-${r.id}`,
      data: r.vencimento,
      tipo: "SAIDA" as const,
      descricao: r.descricao,
      contraparte: r.fornecedor?.nome ?? r.categoria,
      valor: r.valor - r.valorPago,
      status: "PREVISTO" as const,
    })),
  ].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return NextResponse.json({
    inicio: startDate,
    fim: endDate,
    totalEntradas,
    totalSaidas,
    saldo: totalEntradas - totalSaidas,
    previstoEntradas,
    previstoSaidas,
    saldoPrevisto: totalEntradas + previstoEntradas - totalSaidas - previstoSaidas,
    movimentos,
  });
}
