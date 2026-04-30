import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { materialSchema } from "@/lib/validations/material";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const categoria = searchParams.get("categoria");
  const ativo = searchParams.get("ativo");
  const baixo = searchParams.get("baixo");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where: Prisma.MaterialWhereInput = {};
  if (q) where.nome = { contains: q };
  if (categoria) where.categoria = categoria;
  if (ativo === "true") where.ativo = true;
  if (ativo === "false") where.ativo = false;

  const [total, rows] = await Promise.all([
    prisma.material.count({ where }),
    prisma.material.findMany({
      where,
      orderBy: { nome: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { fornecedorPadrao: { select: { id: true, nome: true } } },
    }),
  ]);

  const data = baixo === "true"
    ? rows.filter((m) => m.estoqueAtual < m.estoqueMinimo)
    : rows;

  return NextResponse.json({
    data,
    total: baixo === "true" ? data.length : total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((baixo === "true" ? data.length : total) / pageSize)),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = materialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const material = await prisma.material.create({
      data: {
        nome: data.nome,
        categoria: data.categoria,
        unidade: data.unidade,
        custoMedio: data.custoMedio,
        estoqueAtual: data.estoqueAtual,
        estoqueMinimo: data.estoqueMinimo,
        fornecedorPadraoId: data.fornecedorPadraoId || null,
        ativo: data.ativo,
      },
    });
    return NextResponse.json(material, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar material";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
