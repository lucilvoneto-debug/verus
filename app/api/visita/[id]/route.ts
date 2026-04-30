import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitaUpdateSchema } from "@/lib/validations/visita";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const visita = await prisma.visita.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      tecnico: { select: { id: true, name: true, email: true } },
      orcamentos: { orderBy: { criadoEm: "desc" } },
    },
  });
  if (!visita) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(visita);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = visitaUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const visita = await prisma.visita.update({
    where: { id: params.id },
    data: {
      clienteId: data.clienteId,
      tecnicoId: data.tecnicoId,
      atendimentoId: data.atendimentoId || null,
      endereco: data.endereco,
      dataAgendada: new Date(data.dataAgendada),
      observacoes: data.observacoes || null,
      status: data.status,
      diagnostico: data.diagnostico || null,
      tipoSuperficie: data.tipoSuperficie || null,
      causaProvavel: data.causaProvavel || null,
      solucaoRecomendada: data.solucaoRecomendada || null,
      medidas: data.medidas || null,
      fotos: data.fotos || null,
    },
  });
  return NextResponse.json(visita);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.visita.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
