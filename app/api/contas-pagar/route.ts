import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contaPagarSchema } from "@/lib/validations/contaPagar";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const fornecedorId = searchParams.get("fornecedorId");
  const categoria = searchParams.get("categoria");
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where: Prisma.ContaPagarWhereInput = {};
  if (status === "ABERTA" || status === "PAGA" || status === "PARCIAL") where.status = status;
  if (status === "ATRASADA") {
    where.status = "ABERTA";
    where.vencimento = { lt: new Date() };
  }
  if (fornecedorId) where.fornecedorId = fornecedorId;
  if (categoria) where.categoria = categoria;
  if (inicio || fim) {
    where.vencimento = {
      ...(where.vencimento as object),
      ...(inicio ? { gte: new Date(inicio) } : {}),
      ...(fim ? { lte: new Date(fim) } : {}),
    };
  }

  const [total, rows] = await Promise.all([
    prisma.contaPagar.count({ where }),
    prisma.contaPagar.findMany({
      where,
      orderBy: { vencimento: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        fornecedor: { select: { id: true, nome: true } },
      },
    }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const data = rows.map((r) => ({
    ...r,
    statusComputed:
      r.status === "ABERTA" && r.vencimento < today ? "ATRASADA" : r.status,
  }));

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contaPagarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const conta = await prisma.contaPagar.create({
      data: {
        fornecedorId: data.fornecedorId || null,
        categoria: data.categoria,
        descricao: data.descricao,
        valor: data.valor,
        vencimento: new Date(data.vencimento),
        status: data.status,
        observacoes: data.observacoes || null,
      },
    });
    return NextResponse.json(conta, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar conta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
