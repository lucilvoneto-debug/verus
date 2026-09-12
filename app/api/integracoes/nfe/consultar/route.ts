/** GET ?id=<id no provedor> → status/PDF da nota. */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { consultarNFE } from "@/lib/integrations/nfe";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  const r = await consultarNFE(id);
  return NextResponse.json(r, { status: r.ok ? 200 : 502 });
}
