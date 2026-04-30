import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const visita = await prisma.visita.update({
    where: { id: params.id },
    data: { dataCheckIn: new Date(), status: "EM_ANDAMENTO" },
  });
  return NextResponse.json(visita);
}
