import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const pedido = await prisma.pedidoCompra.findUnique({ where: { id: params.id } });
  if (!pedido) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (pedido.status !== "RASCUNHO") {
    return NextResponse.json({ error: "Pedido já enviado ou finalizado" }, { status: 400 });
  }
  const updated = await prisma.pedidoCompra.update({
    where: { id: params.id },
    data: { status: "ENVIADO" },
  });
  return NextResponse.json(updated);
}
