import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarTokenProposta } from "@/lib/proposta/token";

export const dynamic = "force-dynamic";

/** Gera o link público da proposta e marca o orçamento como ENVIADO. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const o = await prisma.orcamento.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!o) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });

  const token = gerarTokenProposta(o.id);
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const url = `${origin}/proposta/${token}`;

  // marca como ENVIADO se ainda estava em rascunho
  if (o.status === "RASCUNHO") {
    await prisma.orcamento.update({ where: { id: o.id }, data: { status: "ENVIADO" } });
  }

  return NextResponse.json({ url });
}
