/** GET → bytes do arquivo guardado no banco. Público (link de obra, proposta, portal). */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { lerArquivoDb } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!/^[a-z0-9]{10,40}$/i.test(params.id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  const f = await lerArquivoDb(params.id);
  if (!f) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return new NextResponse(new Uint8Array(f.bytes), {
    status: 200,
    headers: {
      "Content-Type": f.mime,
      "Content-Length": String(f.bytes.length),
      // id é imutável: pode cachear forte (CDN + navegador)
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
