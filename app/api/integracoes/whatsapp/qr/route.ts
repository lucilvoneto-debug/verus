import { NextResponse } from "next/server";
import { getQrCode } from "@/lib/integrations/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await getQrCode();
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
