import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fabricanteSchema } from "@/lib/validations/fabricante";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fabricante = await prisma.fabricante.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { produtos: true } },
      produtos: {
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          categoria: true,
          unidade: true,
          custoMedio: true,
          estoqueAtual: true,
          ativo: true,
        },
      },
    },
  });
  if (!fabricante) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(fabricante);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = fabricanteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const fabricante = await prisma.fabricante.update({
    where: { id: params.id },
    data: {
      nome: data.nome,
      ativo: data.ativo,
      catalogoSincronizado: data.catalogoSincronizado,
      fichaTecnicaUrl: data.fichaTecnicaUrl || null,
      fispqUrl: data.fispqUrl || null,
      normasTecnicas: data.normasTecnicas || null,
      garantiaAnosPadrao: data.garantiaAnosPadrao ?? null,
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(fabricante);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.fabricante.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
