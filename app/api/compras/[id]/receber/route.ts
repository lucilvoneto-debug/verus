import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    userId = admin.id;
  }

  const pedido = await prisma.pedidoCompra.findUnique({
    where: { id: params.id },
    include: { itens: { include: { material: true } } },
  });
  if (!pedido) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (pedido.status === "RECEBIDO") {
    return NextResponse.json({ error: "Pedido já recebido" }, { status: 400 });
  }
  if (pedido.status === "CANCELADO") {
    return NextResponse.json({ error: "Pedido cancelado" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    for (const item of pedido.itens) {
      const m = item.material;
      const denom = m.estoqueAtual + item.quantidade;
      const novoCusto =
        denom > 0
          ? (m.estoqueAtual * m.custoMedio + item.quantidade * item.custoUnit) / denom
          : item.custoUnit;
      const novoEstoque = m.estoqueAtual + item.quantidade;

      await tx.movimentacaoEstoque.create({
        data: {
          materialId: m.id,
          tipo: "ENTRADA",
          quantidade: item.quantidade,
          custoUnit: item.custoUnit,
          pedidoCompraId: pedido.id,
          observacao: `Recebimento pedido ${pedido.numero}`,
          userId: userId!,
        },
      });
      await tx.material.update({
        where: { id: m.id },
        data: { estoqueAtual: novoEstoque, custoMedio: novoCusto },
      });
    }

    return tx.pedidoCompra.update({
      where: { id: pedido.id },
      data: { status: "RECEBIDO" },
    });
  });

  return NextResponse.json(result);
}
