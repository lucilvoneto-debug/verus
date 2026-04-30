import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contratoSchema } from "@/lib/validations/contrato";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const contrato = await prisma.contrato.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      orcamento: { select: { id: true, numero: true, total: true } },
      obra: { select: { id: true, numero: true, status: true } },
    },
  });
  if (!contrato) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(contrato);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = contratoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const contrato = await prisma.contrato.update({
    where: { id: params.id },
    data: {
      orcamentoId: data.orcamentoId,
      clienteId: data.clienteId,
      valor: data.valor,
      condicaoPagamento: data.condicaoPagamento,
      prazoExecucao: data.prazoExecucao,
      garantiaMeses: data.garantiaMeses,
      escopo: data.escopo,
      obrigacoesCliente: data.obrigacoesCliente || null,
      obrigacoesEmpresa: data.obrigacoesEmpresa || null,
      clausulasExtras: data.clausulasExtras || null,
    },
  });
  return NextResponse.json(contrato);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.contrato.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
