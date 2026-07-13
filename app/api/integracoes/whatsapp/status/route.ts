import { NextResponse } from "next/server";
import { whatsappStatus, getInstanceState } from "@/lib/integrations/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = whatsappStatus();
  const estado = await getInstanceState();
  return NextResponse.json({ provider: cfg.provider, configurado: cfg.connected, ...estado });
}
