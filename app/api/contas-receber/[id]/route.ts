import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contaReceberSchema } from "@/lib/validations/contaReceber";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const conta = await prisma.contaReceber.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nome: true } },
      contrato: { select: { id: true, numero: true } },
      obra: { select: { id: true, numero: true, nome: true } },
    },
  });
  if (!conta) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(conta);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = contaReceberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const conta = await prisma.contaReceber.update({
    where: { id: params.id },
    data: {
      clienteId: data.clienteId,
      contratoId: data.contratoId || null,
      obraId: data.obraId || null,
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
  await prisma.contaReceber.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
