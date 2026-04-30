import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    userId = admin?.id;
  }
  if (!userId) return NextResponse.json({ ok: false, error: "Sem usuário" }, { status: 401 });

  await prisma.notificacao.updateMany({
    where: { userId, lida: false },
    data: { lida: true },
  });
  return NextResponse.json({ ok: true });
}
