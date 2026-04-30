import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Contratos ASSINADOS que ainda não têm Obra associada — para seleção no formulário de Nova Obra.
export async function GET(_req: NextRequest) {
  const data = await prisma.contrato.findMany({
    where: { status: "ASSINADO", obra: { is: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      numero: true,
      valor: true,
      clienteId: true,
      cliente: { select: { id: true, nome: true } },
    },
    take: 500,
  });
  return NextResponse.json({ data });
}
