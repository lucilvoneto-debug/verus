import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { colaboradorSchema } from "@/lib/validations/colaborador";

export const dynamic = "force-dynamic";

/**
 * GET
 *   padrão      → ativos COM login (selects de técnico/vendedor; devolve userId p/ FK)
 *   ?funcoes=A,B → filtra por função
 *   ?todos=1    → lista completa (com e sem login, ativos e inativos), com alocação atual
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const funcoesParam = searchParams.get("funcoes");
  const todos = searchParams.get("todos") === "1";
  const q = searchParams.get("q")?.trim();
  const ativo = searchParams.get("ativo");

  const where: Prisma.ColaboradorWhereInput = todos ? {} : { ativo: true, userId: { not: null } };
  if (funcoesParam) {
    const funcoes = funcoesParam.split(",").map((f) => f.trim()).filter(Boolean);
    where.funcao = { in: funcoes };
  }
  if (todos) {
    if (q) where.OR = [{ nome: { contains: q, mode: "insensitive" } }, { cpf: { contains: q.replace(/\D+/g, "") || q } }];
    if (ativo === "true") where.ativo = true;
    if (ativo === "false") where.ativo = false;
  }

  if (!todos) {
    const data = await prisma.colaborador.findMany({
      where,
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, funcao: true, userId: true },
      take: 500,
    });
    return NextResponse.json({ data });
  }

  const hoje = new Date();
  const data = await prisma.colaborador.findMany({
    where,
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
    include: {
      user: { select: { id: true, name: true, email: true, role: true, active: true } },
      alocacoes: {
        where: { dataInicio: { lte: hoje }, OR: [{ dataFim: null }, { dataFim: { gte: hoje } }] },
        include: { obra: { select: { id: true, numero: true, nome: true, status: true } } },
        orderBy: { dataInicio: "desc" },
      },
      _count: { select: { pontos: true, alocacoes: true } },
    },
    take: 500,
  });
  return NextResponse.json({ data, total: data.length });
}

export async function POST(req: NextRequest) {
  const parsed = colaboradorSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const dup = await prisma.colaborador.findUnique({ where: { cpf: d.cpf } });
  if (dup) return NextResponse.json({ error: "Já existe colaborador com este CPF" }, { status: 409 });
  if (d.userId) {
    const emUso = await prisma.colaborador.findUnique({ where: { userId: d.userId } });
    if (emUso) return NextResponse.json({ error: "Este login já está vinculado a outro colaborador" }, { status: 409 });
  }
  const c = await prisma.colaborador.create({
    data: {
      nome: d.nome,
      cpf: d.cpf,
      telefone: d.telefone || null,
      funcao: d.funcao,
      custoHora: d.custoHora,
      custoDia: d.custoDia,
      disponivel: d.disponivel,
      ativo: d.ativo,
      observacoes: d.observacoes || null,
      userId: d.userId || null,
    },
  });
  return NextResponse.json(c, { status: 201 });
}
