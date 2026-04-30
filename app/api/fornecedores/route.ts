import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fornecedorSchema } from "@/lib/validations/fornecedor";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const ativo = searchParams.get("ativo");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where: Prisma.FornecedorWhereInput = {};
  if (q) {
    where.OR = [
      { nome: { contains: q } },
      { cnpj: { contains: q } },
    ];
  }
  if (ativo === "true") where.ativo = true;
  if (ativo === "false") where.ativo = false;

  const [total, data] = await Promise.all([
    prisma.fornecedor.count({ where }),
    prisma.fornecedor.findMany({
      where,
      orderBy: { nome: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = fornecedorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome: data.nome,
        cnpj: data.cnpj.replace(/\D/g, ""),
        contato: data.contato || null,
        email: data.email || null,
        telefone: data.telefone || null,
        endereco: data.endereco || null,
        observacoes: data.observacoes || null,
        ativo: data.ativo,
      },
    });
    return NextResponse.json(fornecedor, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar fornecedor";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
