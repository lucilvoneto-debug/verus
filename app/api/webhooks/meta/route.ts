/**
 * Webhook único da Meta (WhatsApp Cloud API + Lead Ads).
 *
 * GET  → handshake (hub.mode=subscribe, hub.verify_token, hub.challenge)
 * POST → eventos:
 *   object=whatsapp_business_account  messages | statuses | smb_message_echoes | history
 *   object=page                       leadgen (formulário de Lead Ads)
 *
 * Configuração no app da Meta (developers.facebook.com):
 *   Callback URL:  https://<dominio>/api/webhooks/meta
 *   Verify token:  META_WEBHOOK_VERIFY_TOKEN
 *   WhatsApp → campos: messages, smb_message_echoes, history, message_template_status_update
 *   Webhooks → Page → leadgen
 *
 * Responde 200 mesmo com erro interno: a Meta desativa webhook que devolve erro.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { graphGet, linhaPorPhoneNumberId, normalizarTelefoneBR, variantesTelefoneBR } from "@/lib/whatsapp/meta";
import { atribuirPorMensagem, criarLead } from "@/lib/crm/leads";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const esperado = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (sp.get("hub.mode") === "subscribe" && esperado && sp.get("hub.verify_token") === esperado) {
    return new NextResponse(sp.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!assinaturaValida(req.headers.get("x-hub-signature-256"), raw)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  try {
    if (body?.object === "whatsapp_business_account") {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const v = change.value ?? {};
          switch (change.field) {
            case "messages":
              await processarMensagens(v);
              break;
            case "smb_message_echoes":
              await processarEchoes(v);
              break;
            case "history":
              await processarHistorico(v);
              break;
            default:
              console.log("[webhook/meta] campo ignorado:", change.field);
          }
        }
      }
    } else if (body?.object === "page") {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          if (change.field === "leadgen") await processarLeadAds(change.value ?? {});
        }
      }
    }
  } catch (e) {
    console.error("[webhook/meta] erro:", e);
  }
  return NextResponse.json({ ok: true });
}

function assinaturaValida(header: string | null, raw: string): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.warn("[webhook/meta] META_APP_SECRET ausente — assinatura não verificada");
    return true;
  }
  if (!header) return false;
  const esperado = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(esperado));
  } catch {
    return false;
  }
}

// ─── Linha / conversa ───────────────────────────────────────────────────────

async function resolverLinha(metadata: any) {
  const pid = metadata?.phone_number_id ? String(metadata.phone_number_id) : null;
  if (!pid) return null;
  const l = await linhaPorPhoneNumberId(pid);
  if (l) return l;
  // Número desconhecido mandando evento = conectado na Meta, ainda sem cadastro. Cria pra não perder nada.
  const total = await prisma.linhaWhatsapp.count();
  return prisma.linhaWhatsapp.create({
    data: {
      phoneNumberId: pid,
      numeroExibicao: normalizarTelefoneBR(metadata?.display_phone_number) || null,
      rotulo: total === 0 ? "Empresa" : null,
      padrao: total === 0,
    },
  });
}

async function acharOuCriarConversa(
  telefone: string,
  linhaId: string | null,
  nome: string | null,
): Promise<{ id: string; criada: boolean; leadId: string | null }> {
  const existente = await prisma.conversaWA.findFirst({
    where: { telefone: { in: variantesTelefoneBR(telefone) }, ...(linhaId ? { linhaId } : {}) },
    orderBy: { ultimaMensagemEm: "desc" },
    select: { id: true, lead: { select: { id: true } } },
  });
  if (existente) {
    if (nome) await prisma.conversaWA.update({ where: { id: existente.id }, data: { nome } }).catch(() => null);
    return { id: existente.id, criada: false, leadId: existente.lead?.id ?? null };
  }
  const nova = await prisma.conversaWA.create({
    data: { telefone, linhaId, nome },
    select: { id: true },
  });
  return { id: nova.id, criada: true, leadId: null };
}

// ─── messages: recebidas + status ───────────────────────────────────────────

async function processarMensagens(v: any) {
  const linha = await resolverLinha(v.metadata);
  const contatos: any[] = v.contacts ?? [];

  for (const msg of v.messages ?? []) {
    if (msg.group_id) continue; // grupo não é cliente
    const de = normalizarTelefoneBR(msg.from);
    if (!de) continue;
    const contato = contatos.find((c) => normalizarTelefoneBR(c.wa_id) === de);
    const nome: string | null = contato?.profile?.name ?? null;
    const texto = extrairTexto(msg);
    const quando = msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date();

    const conversa = await acharOuCriarConversa(de, linha?.id ?? null, nome);

    await prisma.mensagemWA.upsert({
      where: { waId: String(msg.id) },
      create: {
        conversaId: conversa.id,
        waId: String(msg.id),
        texto,
        tipo: mapearTipo(msg.type),
        enviada: false,
        status: "delivered",
        createdAt: quando,
        ...extrairMidia(msg),
      },
      update: {},
    });

    await prisma.conversaWA.update({
      where: { id: conversa.id },
      data: {
        naoLidas: { increment: 1 },
        ultimaMensagem: texto.slice(0, 200),
        ultimaMensagemEm: quando,
        arquivadaEm: null,
        ...(nome ? { nome } : {}),
      },
    });

    // Conversa sem lead → abre lead no CRM com a origem detectada na 1ª mensagem.
    if (!conversa.leadId) {
      const atr = atribuirPorMensagem(texto, msg.referral);
      const { lead } = await criarLead({
        nome,
        telefone: de,
        descricao: texto || "[mídia]",
        conversaId: conversa.id,
        responsavelId: linha?.responsavelId ?? null,
        ...atr,
      });
      // Lead já existia (dedupe) mas sem conversa → amarra.
      if (!lead.conversaId) {
        await prisma.lead.update({ where: { id: lead.id }, data: { conversaId: conversa.id } }).catch(() => null);
      }
      await prisma.leadEvento.create({
        data: { leadId: lead.id, tipo: "WHATSAPP", descricao: `Cliente: ${texto.slice(0, 300)}` },
      });
    }
  }

  for (const st of v.statuses ?? []) {
    if (!st?.id) continue;
    const erro = Array.isArray(st.errors) && st.errors.length
      ? `${st.errors[0].code ?? ""} · ${st.errors[0].title ?? st.errors[0].message ?? ""}`.trim()
      : null;
    await prisma.mensagemWA
      .updateMany({
        where: { waId: String(st.id) },
        data: { status: String(st.status ?? "sent"), ...(erro ? { statusErro: erro } : {}) },
      })
      .catch(() => null);
  }
}

// ─── smb_message_echoes: enviadas pelo celular (coexistência) ───────────────

async function processarEchoes(v: any) {
  const linha = await resolverLinha(v.metadata);
  for (const msg of v.message_echoes ?? []) {
    const para = normalizarTelefoneBR(msg.to);
    if (!para || !msg.id) continue;
    const texto = extrairTexto(msg);
    const quando = msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date();
    const conversa = await acharOuCriarConversa(para, linha?.id ?? null, null);
    await prisma.mensagemWA.upsert({
      where: { waId: String(msg.id) },
      create: {
        conversaId: conversa.id,
        waId: String(msg.id),
        texto,
        tipo: mapearTipo(msg.type),
        enviada: true,
        viaApp: true,
        status: "sent",
        createdAt: quando,
        ...extrairMidia(msg),
      },
      update: {},
    });
    await prisma.conversaWA.update({
      where: { id: conversa.id },
      data: { ultimaMensagem: texto.slice(0, 200), ultimaMensagemEm: quando },
    });
  }
}

// ─── history: sincronização de até 6 meses ao conectar ──────────────────────

async function processarHistorico(v: any) {
  const linha = await resolverLinha(v.metadata);
  const numeroEmpresa = normalizarTelefoneBR(v.metadata?.display_phone_number);
  for (const bloco of v.history ?? []) {
    for (const thread of bloco.threads ?? []) {
      const tel = normalizarTelefoneBR(thread.id);
      if (!tel || tel.length < 10) continue;
      const conversa = await acharOuCriarConversa(tel, linha?.id ?? null, null);
      let ultima: { texto: string; quando: Date } | null = null;
      for (const msg of thread.messages ?? []) {
        if (!msg?.id) continue;
        const de = normalizarTelefoneBR(msg.from);
        const enviada = numeroEmpresa ? de === numeroEmpresa : de !== tel;
        const quando = msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : new Date();
        const texto = extrairTexto(msg);
        await prisma.mensagemWA
          .upsert({
            where: { waId: String(msg.id) },
            create: {
              conversaId: conversa.id,
              waId: String(msg.id),
              texto,
              tipo: mapearTipo(msg.type),
              enviada,
              viaApp: enviada,
              status: "delivered",
              createdAt: quando,
              ...extrairMidia(msg),
            },
            update: {},
          })
          .catch(() => null);
        if (!ultima || quando > ultima.quando) ultima = { texto, quando };
      }
      if (ultima) {
        await prisma.conversaWA.updateMany({
          where: { id: conversa.id, OR: [{ ultimaMensagemEm: null }, { ultimaMensagemEm: { lt: ultima.quando } }] },
          data: { ultimaMensagem: ultima.texto.slice(0, 200), ultimaMensagemEm: ultima.quando },
        });
      }
    }
  }
}

// ─── Lead Ads (formulário instantâneo da Meta) ──────────────────────────────

async function processarLeadAds(v: any) {
  const leadgenId = v?.leadgen_id ? String(v.leadgen_id) : null;
  if (!leadgenId) return;
  const ja = await prisma.metaLead.findUnique({ where: { leadgenId } });
  if (ja) return;

  let dados: any = {};
  try {
    dados = await graphGet(`${leadgenId}?fields=field_data,created_time,ad_id,adset_id,campaign_id,form_id`);
  } catch (e) {
    console.error("[webhook/meta] leadgen fetch:", e);
  }
  const campos: Record<string, string> = {};
  for (const f of dados?.field_data ?? []) {
    campos[String(f.name).toLowerCase()] = Array.isArray(f.values) ? String(f.values[0] ?? "") : "";
  }
  const nome = campos.full_name || campos.nome || campos.name || null;
  const telefone = campos.phone_number || campos.telefone || campos.whatsapp || null;
  const email = campos.email || null;
  const cidade = campos.city || campos.cidade || null;
  const extras = Object.entries(campos)
    .filter(([k]) => !["full_name", "nome", "name", "phone_number", "telefone", "whatsapp", "email", "city", "cidade"].includes(k))
    .map(([k, val]) => `${k}: ${val}`)
    .join(" · ");

  const { lead } = await criarLead({
    nome,
    telefone,
    email,
    cidade,
    origem: "META_ADS",
    descricao: `Formulário Meta Ads${extras ? ` — ${extras}` : ""}`,
    utmSource: "meta",
    utmMedium: "lead_ads",
    utmCampaign: dados?.campaign_id ? String(dados.campaign_id) : null,
    utmContent: dados?.adset_id ? String(dados.adset_id) : null,
    adId: dados?.ad_id ? String(dados.ad_id) : (v?.ad_id ? String(v.ad_id) : null),
  });

  await prisma.metaLead.create({
    data: {
      leadgenId,
      formId: v?.form_id ? String(v.form_id) : dados?.form_id ? String(dados.form_id) : null,
      pageId: v?.page_id ? String(v.page_id) : null,
      adId: dados?.ad_id ? String(dados.ad_id) : null,
      adsetId: dados?.adset_id ? String(dados.adset_id) : null,
      campaignId: dados?.campaign_id ? String(dados.campaign_id) : null,
      payload: dados?.field_data ?? v ?? {},
      nome,
      email,
      telefone: normalizarTelefoneBR(telefone) || null,
      leadId: lead.id,
      criadoNaMetaEm: dados?.created_time ? new Date(dados.created_time) : null,
    },
  });
}

// ─── Helpers de mensagem ────────────────────────────────────────────────────

function extrairTexto(msg: any): string {
  switch (msg?.type) {
    case "text": return msg.text?.body ?? "";
    case "image": return msg.image?.caption ?? "[imagem]";
    case "audio": return "[áudio]";
    case "video": return msg.video?.caption ?? "[vídeo]";
    case "document": return msg.document?.caption ?? msg.document?.filename ?? "[documento]";
    case "location": return msg.location?.name ? `[localização] ${msg.location.name}` : "[localização]";
    case "sticker": return "[sticker]";
    case "contacts": return msg.contacts?.[0]?.name?.formatted_name ? `[contato] ${msg.contacts[0].name.formatted_name}` : "[contato]";
    case "button": return msg.button?.text ?? "[botão]";
    case "interactive": {
      const it = msg.interactive ?? {};
      return it.button_reply?.title ?? it.list_reply?.title ?? it.nfm_reply?.body ?? "[interativo]";
    }
    case "reaction": return msg.reaction?.emoji ?? "[reação]";
    case "request_welcome": return "[cliente abriu a conversa]";
    case "unsupported": return "[mensagem não suportada — abra no celular]";
    default: return msg?.type ? `[${msg.type}]` : "";
  }
}

function mapearTipo(t: string | undefined): string {
  switch (t) {
    case "image": return "IMAGE";
    case "audio": return "AUDIO";
    case "video": return "VIDEO";
    case "document": return "DOCUMENT";
    case "location": return "LOCATION";
    case "sticker": return "STICKER";
    case "contacts": return "CONTACT";
    default: return "TEXT";
  }
}

function extrairMidia(msg: any) {
  const m = msg?.[msg?.type];
  if (!m || typeof m !== "object") return {};
  const out: { mediaId?: string; mediaMime?: string; mediaNome?: string; latitude?: number; longitude?: number } = {};
  if (m.id) out.mediaId = String(m.id);
  if (m.mime_type) out.mediaMime = String(m.mime_type);
  if (m.filename) out.mediaNome = String(m.filename);
  if (msg.type === "location") {
    out.latitude = Number(m.latitude);
    out.longitude = Number(m.longitude);
  }
  return out;
}
