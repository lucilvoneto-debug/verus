import { NextRequest, NextResponse } from "next/server";
import { obra3dPorSlug } from "@/lib/obras/obra3d";
import { gravaMedicaoDaObra, medicaoDaObra } from "@/lib/obras/obra3d-medicao";

export const dynamic = "force-dynamic";

/** Medição marcada na página 3D da obra. O login é conferido pelo middleware (/api/obras). */
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const obra = obra3dPorSlug(params.slug);
  if (!obra) return NextResponse.json({ error: "Obra 3D não encontrada." }, { status: 404 });
  return NextResponse.json({ m: await medicaoDaObra(obra) });
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
  return NextResponse.json({ m: await gravaMedicaoDaObra(obra, corpo.patch) });
}
