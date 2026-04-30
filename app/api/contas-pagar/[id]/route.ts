import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contaPagarSchema } from "@/lib/validations/contaPagar";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const conta = await prisma.contaPagar.findUnique({
    where: { id: params.id },
    include: { fornecedor: { select: { id: true, nome: true } } },
  });
  if (!conta) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(conta);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = contaPagarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const conta = await prisma.contaPagar.update({
    where: { id: params.id },
    data: {
      fornecedorId: data.fornecedorId || null,
      categoria: data.categoria,
      descricao: data.descricao,
      valor: data.valor,
      vencimento: new Date(data.vencimento),
      status: data.status,
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(conta);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.contaPagar.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
