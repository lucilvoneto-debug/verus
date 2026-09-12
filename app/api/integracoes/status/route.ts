import { NextResponse } from "next/server";
import { whatsappStatus } from "@/lib/integrations/whatsapp";
import { nfeStatus } from "@/lib/integrations/nfe";
import { emailStatus } from "@/lib/integrations/email";
import { storageStatus } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    whatsapp: whatsappStatus(),
    nfe: nfeStatus(),
    email: emailStatus(),
    storage: storageStatus(),
  });
}
