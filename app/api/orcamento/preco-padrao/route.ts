import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CHAVE = "orcamento.preco_m2";

/** Lê o preço/m² de mão de obra padrão. */
export async function GET() {
  const row = await prisma.configuracao.findFirst({ where: { chave: CHAVE } });
  const preco = row ? Number(row.valor) || 0 : 0;
  return NextResponse.json({ preco });
}

/** Salva o preço/m² padrão (cadastra uma vez, reusa em todo orçamento por planta). */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const preco = Number(body.preco);
  if (!isFinite(preco) || preco < 0) {
    return NextResponse.json({ error: "Preço inválido." }, { status: 400 });
  }
  const existente = await prisma.configuracao.findFirst({ where: { chave: CHAVE } });
  if (existente) {
    await prisma.configuracao.update({ where: { id: existente.id }, data: { valor: String(preco) } });
  } else {
    await prisma.configuracao.create({
      data: { chave: CHAVE, valor: String(preco), descricao: "Preço/m² de mão de obra padrão (orçamento por planta)" },
    });
  }
  return NextResponse.json({ ok: true, preco });
}
