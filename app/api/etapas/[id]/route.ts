import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { etapaSchema } from "@/lib/validations/etapa";

export const dynamic = "force-dynamic";

function parseList(s: string | null): unknown[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const etapa = await prisma.etapa.findUnique({
    where: { id: params.id },
    include: {
      obra: { select: { id: true, numero: true, nome: true } },
      responsavel: { select: { id: true, name: true } },
    },
  });
  if (!etapa) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({
    ...etapa,
    checklist: parseList(etapa.checklist),
    fotos: parseList(etapa.fotos),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = etapaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const etapa = await prisma.etapa.update({
    where: { id: params.id },
    data: {
      obraId: data.obraId,
      ordem: data.ordem,
      nome: data.nome,
      descricao: data.descricao || null,
      responsavelId: data.responsavelId || null,
      dataPrevista: new Date(data.dataPrevista),
      status: data.status,
      checklist: JSON.stringify(data.checklist ?? []),
      fotos: JSON.stringify(data.fotos ?? []),
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(etapa);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.etapa.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
