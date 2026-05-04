import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const orc = await prisma.orcamento.findFirst({
    where: { id: params.id, clienteId },
    include: { itens: true },
  });
  if (!orc) return NextResponse.json({ error: "Não encontrado" }, { status: 403 });
  return NextResponse.json(orc);
}
