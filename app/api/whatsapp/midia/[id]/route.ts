/** Proxy de mídia da Cloud API (a URL da Meta exige Bearer e expira). */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { baixarMidia } from "@/lib/whatsapp/meta";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const m = await baixarMidia(params.id);
  if (!m) return new NextResponse("mídia indisponível", { status: 404 });
  return new NextResponse(new Uint8Array(m.bytes), {
    status: 200,
    headers: { "Content-Type": m.mime, "Cache-Control": "private, max-age=3600" },
  });
}
