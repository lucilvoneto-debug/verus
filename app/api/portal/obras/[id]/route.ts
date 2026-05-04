import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const obra = await prisma.obra.findFirst({
    where: { id: params.id, clienteId },
    include: {
      etapas: { orderBy: { ordem: "asc" } },
      diarios: {
        where: { data: { gte: new Date(Date.now() - 30 * 86400000) } },
        orderBy: { data: "desc" },
      },
      medicoes: { orderBy: { numero: "asc" } },
    },
  });
  if (!obra) return NextResponse.json({ error: "Não encontrado" }, { status: 403 });

  const anexos = await prisma.anexo.findMany({
    where: { entidade: "OBRA", entidadeId: obra.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ obra, anexos });
}
