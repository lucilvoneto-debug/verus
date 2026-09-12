import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { colaboradorSchema } from "@/lib/validations/colaborador";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const c = await prisma.colaborador.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, active: true } },
      alocacoes: {
        include: { obra: { select: { id: true, numero: true, nome: true, status: true } } },
        orderBy: { dataInicio: "desc" },
        take: 50,
      },
      pontos: { orderBy: { dataHora: "desc" }, take: 30, include: { obra: { select: { id: true, numero: true, nome: true } } } },
    },
  });
  if (!c) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(c);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = colaboradorSchema.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  if (d.cpf) {
    const dup = await prisma.colaborador.findFirst({ where: { cpf: d.cpf, NOT: { id: params.id } } });
    if (dup) return NextResponse.json({ error: "CPF já usado por outro colaborador" }, { status: 409 });
  }
  if (d.userId) {
    const emUso = await prisma.colaborador.findFirst({ where: { userId: d.userId, NOT: { id: params.id } } });
    if (emUso) return NextResponse.json({ error: "Este login já está vinculado a outro colaborador" }, { status: 409 });
  }
  const c = await prisma.colaborador.update({
    where: { id: params.id },
    data: {
      ...(d.nome !== undefined ? { nome: d.nome } : {}),
      ...(d.cpf !== undefined ? { cpf: d.cpf } : {}),
      ...(d.telefone !== undefined ? { telefone: d.telefone || null } : {}),
      ...(d.funcao !== undefined ? { funcao: d.funcao } : {}),
      ...(d.custoHora !== undefined ? { custoHora: d.custoHora } : {}),
      ...(d.custoDia !== undefined ? { custoDia: d.custoDia } : {}),
      ...(d.disponivel !== undefined ? { disponivel: d.disponivel } : {}),
      ...(d.ativo !== undefined ? { ativo: d.ativo } : {}),
      ...(d.observacoes !== undefined ? { observacoes: d.observacoes || null } : {}),
      ...(d.userId !== undefined ? { userId: d.userId || null } : {}),
    },
  });
  return NextResponse.json(c);
}

/** Inativa. Ponto e alocação têm FK — não apaga de verdade. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.colaborador.update({ where: { id: params.id }, data: { ativo: false, disponivel: false } });
  return NextResponse.json({ ok: true });
}
