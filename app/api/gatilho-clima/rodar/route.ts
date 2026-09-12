/** POST { gatilhoId?, forcar? } → roda a verificação agora (ADMIN/GESTOR/COMERCIAL). */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { processarGatilhosClima } from "@/lib/pos-venda";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const r = await processarGatilhosClima({ gatilhoId: body.gatilhoId, forcar: body.forcar === true });
  return NextResponse.json(r);
}
