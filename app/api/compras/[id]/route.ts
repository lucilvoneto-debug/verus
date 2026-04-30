import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pedidoCompraSchema } from "@/lib/validations/pedidoCompra";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const pedido = await prisma.pedidoCompra.findUnique({
    where: { id: params.id },
    include: {
      fornecedor: true,
      itens: {
        include: { material: { select: { id: true, nome: true, unidade: true } } },
      },
    },
  });
  if (!pedido) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(pedido);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = pedidoCompraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const total = data.itens.reduce((s, i) => s + i.subtotal, 0);

  const existing = await prisma.pedidoCompra.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (existing.status !== "RASCUNHO") {
    return NextResponse.json({ error: "Só é possível editar pedidos em rascunho" }, { status: 400 });
  }

  const pedido = await prisma.$transaction(async (tx) => {
    await tx.itemCompra.deleteMany({ where: { pedidoId: params.id } });
    return tx.pedidoCompra.update({
      where: { id: params.id },
      data: {
        fornecedorId: data.fornecedorId,
        dataPedido: new Date(data.dataPedido),
        dataPrevista: new Date(data.dataPrevista),
        observacoes: data.observacoes || null,
        total,
        itens: {
          create: data.itens.map((i) => ({
            materialId: i.materialId,
            quantidade: i.quantidade,
            custoUnit: i.custoUnit,
            subtotal: i.subtotal,
          })),
        },
      },
      include: { itens: true },
    });
  });

  return NextResponse.json(pedido);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.pedidoCompra.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
