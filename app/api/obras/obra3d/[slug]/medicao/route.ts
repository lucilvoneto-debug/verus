import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chaveMedicao, juntaMedicao, leMedicao, obra3dPorSlug } from "@/lib/obras/obra3d";

export const dynamic = "force-dynamic";

/** Medição marcada na página 3D da obra. O login é conferido pelo middleware (/api/obras). */
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const obra = obra3dPorSlug(params.slug);
  if (!obra) return NextResponse.json({ error: "Obra 3D não encontrada." }, { status: 404 });
  const row = await prisma.configuracao.findUnique({ where: { chave: chaveMedicao(obra.slug) } });
  return NextResponse.json({ m: leMedicao(row?.valor) });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const obra = obra3dPorSlug(params.slug);
  if (!obra) return NextResponse.json({ error: "Obra 3D não encontrada." }, { status: 404 });
  let corpo: { patch?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }
  const chave = chaveMedicao(obra.slug);
  const m = await prisma.$transaction(async (tx) => {
    const row = await tx.configuracao.findUnique({ where: { chave } });
    const novo = juntaMedicao(leMedicao(row?.valor), corpo.patch);
    const valor = JSON.stringify(novo);
    await tx.configuracao.upsert({
      where: { chave },
      update: { valor },
      create: { chave, valor, descricao: `Medição marcada na página 3D: ${obra.titulo}` },
    });
    return novo;
  });
  return NextResponse.json({ m });
}
