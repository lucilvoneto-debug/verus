import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chamadoSchema } from "@/lib/validations/chamado";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const chamado = await prisma.chamadoAssistencia.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      garantia: {
        include: {
          obra: { select: { id: true, numero: true, nome: true } },
        },
      },
      tecnico: { select: { id: true, name: true } },
    },
  });
  if (!chamado) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(chamado);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = chamadoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const chamado = await prisma.chamadoAssistencia.update({
    where: { id: params.id },
    data: {
      garantiaId: data.garantiaId,
      clienteId: data.clienteId,
      descricao: data.descricao,
      fotos:
        data.fotos !== undefined
          ? data.fotos.length > 0
            ? JSON.stringify(data.fotos)
            : null
          : undefined,
      tecnicoId: data.tecnicoId === "" ? null : data.tecnicoId,
      observacoes: data.observacoes ?? undefined,
    },
  });
  return NextResponse.json(chamado);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.chamadoAssistencia.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
