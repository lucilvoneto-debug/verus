export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { atendimentoSchema } from "@/lib/validations/atendimento";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const a = await prisma.atendimento.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      responsavel: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, status: true, origem: true, nome: true, telefone: true } },
      visitas: {
        orderBy: { dataAgendada: "desc" },
        select: { id: true, dataAgendada: true, status: true, endereco: true, tecnico: { select: { name: true } } },
      },
    },
  });
  if (!a) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(a);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = atendimentoSchema.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const a = await prisma.atendimento.update({
    where: { id: params.id },
    data: {
      ...(d.clienteId !== undefined ? { clienteId: d.clienteId } : {}),
      ...(d.leadId !== undefined ? { leadId: d.leadId || null } : {}),
      ...(d.canal !== undefined ? { canal: d.canal } : {}),
      ...(d.descricao !== undefined ? { descricao: d.descricao } : {}),
      ...(d.urgencia !== undefined ? { urgencia: d.urgencia } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.responsavelId !== undefined ? { responsavelId: d.responsavelId } : {}),
      ...(d.fotos !== undefined ? { fotos: d.fotos.length ? JSON.stringify(d.fotos) : null } : {}),
    },
    include: { cliente: { select: { id: true, nome: true } }, responsavel: { select: { id: true, name: true } } },
  });
  return NextResponse.json(a);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const visitas = await prisma.visita.count({ where: { atendimentoId: params.id } });
  if (visitas > 0) {
    return NextResponse.json({ error: "Atendimento tem visitas vinculadas — cancele em vez de excluir" }, { status: 409 });
  }
  await prisma.atendimento.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
