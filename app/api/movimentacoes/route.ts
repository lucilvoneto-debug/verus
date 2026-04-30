import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const materialId = searchParams.get("materialId");
  const obraId = searchParams.get("obraId");
  const tipo = searchParams.get("tipo");
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where: Prisma.MovimentacaoEstoqueWhereInput = {};
  if (materialId) where.materialId = materialId;
  if (obraId) where.obraId = obraId;
  if (tipo === "ENTRADA" || tipo === "SAIDA" || tipo === "AJUSTE") where.tipo = tipo;
  if (inicio || fim) {
    where.createdAt = {
      ...(inicio ? { gte: new Date(inicio) } : {}),
      ...(fim ? { lte: new Date(fim) } : {}),
    };
  }

  const [total, data] = await Promise.all([
    prisma.movimentacaoEstoque.count({ where }),
    prisma.movimentacaoEstoque.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        material: { select: { id: true, nome: true, unidade: true } },
        obra: { select: { id: true, numero: true, nome: true } },
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
