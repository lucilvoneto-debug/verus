import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { servicoSchema } from "@/lib/validations/servico";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const servico = await prisma.servico.findUnique({
    where: { id: params.id },
    include: {
      materiais: {
        include: { material: true },
      },
    },
  });
  if (!servico) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(servico);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = servicoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const servico = await prisma.servico.update({
    where: { id: params.id },
    data: {
      nome: data.nome,
      descricao: data.descricao || null,
      unidade: data.unidade,
      custoPadrao: data.custoPadrao,
      precoPadrao: data.precoPadrao,
      tempoMedio: data.tempoMedio ?? null,
      observacoesTecnicas: data.observacoesTecnicas || null,
      ativo: data.ativo,
    },
  });
  return NextResponse.json(servico);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.servico.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
