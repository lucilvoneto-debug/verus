import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarTokenObra } from "@/lib/proposta/token";

export const dynamic = "force-dynamic";

/** Gera o link público de acompanhamento da obra (construtora, sem login). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const o = await prisma.obra.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!o) return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  return NextResponse.json({ url: `${origin}/obra/${gerarTokenObra(o.id)}` });
}
