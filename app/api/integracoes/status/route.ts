import { NextResponse } from "next/server";
import { whatsappStatus } from "@/lib/integrations/whatsapp";
import { nfeStatus } from "@/lib/integrations/nfe";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    whatsapp: whatsappStatus(),
    nfe: nfeStatus(),
  });
}
