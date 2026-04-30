import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { receberSchema } from "@/lib/validations/contaReceber";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = receberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const conta = await prisma.contaReceber.findUnique({ where: { id: params.id } });
  if (!conta) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { valorPago, formaPagamento, comprovanteUrl, observacoes } = parsed.data;
  const novoValorPago = conta.valorPago + valorPago;
  const novoStatus = novoValorPago >= conta.valor ? "PAGA" : "PARCIAL";

  const updated = await prisma.contaReceber.update({
    where: { id: params.id },
    data: {
      valorPago: novoValorPago,
      formaPagamento,
      comprovanteUrl: comprovanteUrl || null,
      observacoes: observacoes || conta.observacoes,
      status: novoStatus,
    },
  });
  return NextResponse.json(updated);
}
