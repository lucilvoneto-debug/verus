/** GET ?linhaId= → templates aprovados da WABA da linha (ou da linha padrão). */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CFG_KEYS, lerConfig, linhaPadrao, listarTemplates } from "@/lib/whatsapp/meta";

export async function GET(req: NextRequest) {
  const linhaId = new URL(req.url).searchParams.get("linhaId");
  const linha = linhaId ? await prisma.linhaWhatsapp.findUnique({ where: { id: linhaId } }) : await linhaPadrao();
  const wabaId = linha?.wabaId ?? (await lerConfig(CFG_KEYS.wabaId));
  if (!wabaId) return NextResponse.json({ error: "WABA não configurada. Conecte um número em Configurações → WhatsApp." }, { status: 400 });
  try {
    const data = await listarTemplates(wabaId);
    return NextResponse.json({ data, wabaId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Falha ao listar templates" }, { status: 502 });
  }
}
