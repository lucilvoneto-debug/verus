import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orcamentoSchema } from "@/lib/validations/orcamento";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const orcamento = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      vendedor: { select: { id: true, name: true, email: true } },
      visita: { select: { id: true, dataAgendada: true, endereco: true } },
      itens: { include: { servico: { select: { id: true, nome: true } } } },
      contrato: { select: { id: true, numero: true } },
    },
  });
  if (!orcamento) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(orcamento);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = orcamentoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const itensCalc = data.itens.map((it) => {
    const subtotal = +(it.quantidade * it.precoUnit).toFixed(2);
    return { ...it, subtotal };
  });
  const subtotal = +itensCalc.reduce((s, it) => s + it.subtotal, 0).toFixed(2);
  const desconto = +data.desconto.toFixed(2);
  const total = +Math.max(0, subtotal - desconto).toFixed(2);
  const custoEstimado = +itensCalc
    .reduce((s, it) => s + it.quantidade * it.custoUnit, 0)
    .toFixed(2);
  const margemPrevista = total > 0 ? +(((total - custoEstimado) / total) * 100).toFixed(2) : 0;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.orcamentoItem.deleteMany({ where: { orcamentoId: params.id } });
    return tx.orcamento.update({
      where: { id: params.id },
      data: {
        clienteId: data.clienteId,
        visitaId: data.visitaId || null,
        vendedorId: data.vendedorId,
        dataValidade: new Date(data.dataValidade),
        status: data.status,
        subtotal,
        desconto,
        total,
        custoEstimado,
        margemPrevista,
        condicaoPagamento: data.condicaoPagamento || null,
        prazoExecucao: data.prazoExecucao || null,
        observacoes: data.observacoes || null,
        itens: {
          create: itensCalc.map((it) => ({
            servicoId: it.servicoId,
            descricao: it.descricao,
            area: it.area ?? null,
            quantidade: it.quantidade,
            unidade: it.unidade,
            custoUnit: it.custoUnit,
            precoUnit: it.precoUnit,
            subtotal: it.subtotal,
          })),
        },
      },
      include: { itens: true },
    });
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.$transaction([
    prisma.orcamentoItem.deleteMany({ where: { orcamentoId: params.id } }),
    prisma.orcamento.delete({ where: { id: params.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
