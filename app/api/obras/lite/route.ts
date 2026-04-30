import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Lista enxuta de obras para uso em selects.
export async function GET(_req: NextRequest) {
  const data = await prisma.obra.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      numero: true,
      nome: true,
      status: true,
      contratoId: true,
      clienteId: true,
      contrato: { select: { valor: true } },
    },
    take: 500,
  });
  return NextResponse.json({ data });
}
