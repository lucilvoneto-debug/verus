/**
 * Finaliza o Embedded Signup (coexistência): troca o `code` do popup da Meta
 * por um token, guarda o token/WABA/número em Configuracao, cria a linha e
 * inscreve o app nos webhooks da WABA nova. POST {code, signup}.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CFG_KEYS, GRAPH_BASE, graphGet, gravarConfig, inscreverWebhookWaba, metaAppId, normalizarTelefoneBR,
} from "@/lib/whatsapp/meta";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Somente ADMIN" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const code = body?.code ? String(body.code) : null;
  const signup = body?.signup ?? {};
  const wabaId = signup?.waba_id ? String(signup.waba_id) : null;
  const phoneNumberId = signup?.phone_number_id ? String(signup.phone_number_id) : null;
  const businessId = signup?.business_id ? String(signup.business_id) : null;

  const appId = metaAppId();
  const appSecret = process.env.META_APP_SECRET;
  let tokenOk = false;
  let erro: string | null = null;

  if (!code) erro = "code ausente (popup não devolveu)";
  else if (!appId || !appSecret) erro = "META_APP_ID / META_APP_SECRET ausentes no servidor";
  else {
    try {
      const r = await fetch(
        `${GRAPH_BASE}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`,
        { cache: "no-store" },
      );
      const d: any = await r.json().catch(() => ({}));
      if (d?.access_token) {
        tokenOk = true;
        // Token do Embedded Signup é de longa duração e escopado à WABA concedida.
        // Só usa se não houver token de usuário do sistema no env.
        if (!process.env.META_ACCESS_TOKEN) {
          await gravarConfig(CFG_KEYS.token, String(d.access_token), "Token WhatsApp Cloud API (Embedded Signup)");
        }
      } else erro = d?.error?.message || `Graph ${r.status}`;
    } catch (e) {
      erro = e instanceof Error ? e.message : "falha de rede";
    }
  }

  if (wabaId) await gravarConfig(CFG_KEYS.wabaId, wabaId, "WABA (WhatsApp Business Account)");
  if (businessId) await gravarConfig(CFG_KEYS.businessId, businessId, "Business ID da Meta");

  if (phoneNumberId) {
    let numeroExibicao: string | null = null;
    let nomeVerificado: string | null = null;
    try {
      const p = await graphGet<{ display_phone_number?: string; verified_name?: string }>(
        `${phoneNumberId}?fields=display_phone_number,verified_name`,
      );
      numeroExibicao = normalizarTelefoneBR(p?.display_phone_number) || null;
      nomeVerificado = p?.verified_name ?? null;
    } catch { /* preenche depois na tela */ }

    const total = await prisma.linhaWhatsapp.count();
    await prisma.linhaWhatsapp.upsert({
      where: { phoneNumberId },
      create: {
        phoneNumberId,
        wabaId,
        numeroExibicao,
        nomeVerificado,
        rotulo: total === 0 ? "Empresa" : nomeVerificado,
        padrao: total === 0,
        ativo: true,
      },
      update: { wabaId: wabaId ?? undefined, numeroExibicao: numeroExibicao ?? undefined, nomeVerificado: nomeVerificado ?? undefined, ativo: true },
    });
    if (total === 0) await gravarConfig(CFG_KEYS.phoneNumberId, phoneNumberId, "Número padrão (phone_number_id)");
  }

  let webhookOk = false;
  if (wabaId) webhookOk = await inscreverWebhookWaba(wabaId);

  return NextResponse.json({
    ok: tokenOk,
    error: tokenOk ? undefined : erro,
    signup: { waba_id: wabaId, phone_number_id: phoneNumberId, business_id: businessId },
    webhookOk,
  });
}
