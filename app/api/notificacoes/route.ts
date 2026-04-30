import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getUserId() {
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (id) return id;
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  return admin?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ data: [], total: 0 });

  const { searchParams } = new URL(req.url);
  const lida = searchParams.get("lida");
  const where: { userId: string; lida?: boolean } = { userId };
  if (lida === "true") where.lida = true;
  if (lida === "false") where.lida = false;

  const [total, data, naoLidas] = await Promise.all([
    prisma.notificacao.count({ where }),
    prisma.notificacao.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.notificacao.count({ where: { userId, lida: false } }),
  ]);

  return NextResponse.json({ data, total, naoLidas });
}
