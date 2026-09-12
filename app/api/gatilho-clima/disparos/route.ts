export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const gatilhoId = sp.get("gatilhoId");
  const data = await prisma.disparoTemporal.findMany({
    where: gatilhoId ? { gatilhoId } : {},
    orderBy: { createdAt: "desc" },
    include: { cliente: { select: { id: true, nome: true, cidade: true } } },
    take: 200,
  });
  return NextResponse.json({ data });
}
