import { NextRequest, NextResponse } from "next/server";
import { obra3dPorPasta } from "@/lib/obras/obra3d";
import { gravaMedicaoDaObra, medicaoDaObra } from "@/lib/obras/obra3d-medicao";

export const dynamic = "force-dynamic";

/**
 * Medição marcada na página 3D, sem login: quem tem o endereço da página (a pasta com o
 * código no fim) vê e marca, como no link da construtora. /api/obra/ é público no middleware.
 */
export async function GET(_req: NextRequest, { params }: { params: { pasta: string } }) {
  const obra = obra3dPorPasta(params.pasta);
  if (!obra) return NextResponse.json({ error: "Obra 3D não encontrada." }, { status: 404 });
  return NextResponse.json({ m: await medicaoDaObra(obra) });
}

export async function POST(req: NextRequest, { params }: { params: { pasta: string } }) {
  const obra = obra3dPorPasta(params.pasta);
  if (!obra) return NextResponse.json({ error: "Obra 3D não encontrada." }, { status: 404 });
  let corpo: { patch?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
  }
  return NextResponse.json({ m: await gravaMedicaoDaObra(obra, corpo.patch) });
}
