import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Obras FINALIZADAs sem garantia associada — para seleção em Nova Garantia.
export async function GET(_req: NextRequest) {
  const data = await prisma.obra.findMany({
    where: {
      status: "FINALIZADA",
      garantias: { none: {} },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      numero: true,
      nome: true,
      dataConclusao: true,
      previsaoTermino: true,
      cliente: { select: { id: true, nome: true } },
    },
    take: 500,
  });
  return NextResponse.json({ data });
}
