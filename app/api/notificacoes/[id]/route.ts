import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const lida = typeof body?.lida === "boolean" ? body.lida : true;
  const updated = await prisma.notificacao.update({
    where: { id: params.id },
    data: { lida },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.notificacao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
