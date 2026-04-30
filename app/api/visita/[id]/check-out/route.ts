import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const visita = await prisma.visita.update({
    where: { id: params.id },
    data: { dataCheckOut: new Date(), status: "CONCLUIDA" },
  });
  return NextResponse.json(visita);
}
