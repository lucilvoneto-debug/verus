import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Busca global: clientes, orçamentos, obras e contratos por texto. */
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ clientes: [], orcamentos: [], obras: [], contratos: [] });

  const [clientes, orcamentos, obras, contratos] = await Promise.all([
    prisma.cliente.findMany({
      where: { OR: [{ nome: { contains: q, mode: "insensitive" } }, { documento: { contains: q } }] },
      select: { id: true, nome: true, documento: true },
      take: 6,
    }),
    prisma.orcamento.findMany({
      where: { OR: [{ numero: { contains: q, mode: "insensitive" } }, { cliente: { nome: { contains: q, mode: "insensitive" } } }] },
      select: { id: true, numero: true, total: true, status: true, cliente: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 6,
    }),
    prisma.obra.findMany({
      where: { OR: [{ numero: { contains: q, mode: "insensitive" } }, { nome: { contains: q, mode: "insensitive" } }] },
      select: { id: true, numero: true, nome: true, status: true },
      take: 6,
    }),
    prisma.contrato.findMany({
      where: { numero: { contains: q, mode: "insensitive" } },
      select: { id: true, numero: true, status: true },
      take: 6,
    }),
  ]);

  return NextResponse.json({ clientes, orcamentos, obras, contratos });
}
