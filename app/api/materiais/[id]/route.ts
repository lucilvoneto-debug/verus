import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { materialSchema } from "@/lib/validations/material";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const material = await prisma.material.findUnique({
    where: { id: params.id },
    include: {
      fornecedorPadrao: { select: { id: true, nome: true } },
      movimentacoes: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          obra: { select: { id: true, numero: true, nome: true } },
          user: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!material) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(material);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = materialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const material = await prisma.material.update({
    where: { id: params.id },
    data: {
      nome: data.nome,
      categoria: data.categoria,
      unidade: data.unidade,
      custoMedio: data.custoMedio,
      estoqueMinimo: data.estoqueMinimo,
      fornecedorPadraoId: data.fornecedorPadraoId || null,
      ativo: data.ativo,
    },
  });
  return NextResponse.json(material);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.material.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
