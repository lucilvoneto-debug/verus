/**
 * WhatsApp Cloud API (Meta) — coexistência com o app WhatsApp Business.
 *
 * Credenciais (prioridade: env → tabela Configuracao):
 *   META_APP_ID / META_APP_SECRET       app da Meta (developers.facebook.com)
 *   META_ACCESS_TOKEN                   token de usuário do sistema (Business) OU
 *                                       token trocado no Embedded Signup (salvo em Configuracao)
 *   META_WEBHOOK_VERIFY_TOKEN           handshake do webhook
 *   META_ES_CONFIG_ID                   configuração do Cadastro Incorporado (coexistência)
 */
import { prisma } from "@/lib/prisma";

export const GRAPH_BASE = "https://graph.facebook.com/v21.0";

export const CFG_KEYS = {
  token: "meta_access_token",
  wabaId: "meta_waba_id",
  phoneNumberId: "meta_phone_number_id",
  businessId: "meta_business_id",
} as const;

export async function lerConfig(chave: string): Promise<string | null> {
  try {
    const c = await prisma.configuracao.findUnique({ where: { chave } });
    return c?.valor || null;
  } catch {
    return null;
  }
}

export async function gravarConfig(chave: string, valor: string, descricao?: string) {
  await prisma.configuracao.upsert({
    where: { chave },
    create: { chave, valor, descricao },
    update: { valor, ...(descricao ? { descricao } : {}) },
  });
}

export async function metaToken(): Promise<string | null> {
  return process.env.META_ACCESS_TOKEN || (await lerConfig(CFG_KEYS.token));
}

export function metaAppId(): string {
  return process.env.META_APP_ID ?? "";
}

export async function graphGet<T = any>(path: string, token?: string | null): Promise<T> {
  const t = token ?? (await metaToken());
  if (!t) throw new Error("Token da Meta ausente");
  const r = await fetch(`${GRAPH_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${t}` },
    cache: "no-store",
  });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.error?.message || `Graph ${r.status}`);
  return d as T;
}

export async function graphPost<T = any>(path: string, body: unknown, token?: string | null): Promise<T> {
  const t = token ?? (await metaToken());
  if (!t) throw new Error("Token da Meta ausente");
  const r = await fetch(`${GRAPH_BASE}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const d: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = d?.error;
    throw new Error(e ? `${e.code ?? ""} ${e.message ?? ""}${e.error_data?.details ? " · " + e.error_data.details : ""}`.trim() : `Graph ${r.status}`);
  }
  return d as T;
}

// ─── Telefone BR ────────────────────────────────────────────────────────────

export function soDigitos(v: string | null | undefined): string {
  return String(v ?? "").replace(/\D+/g, "");
}

/** Normaliza pra E.164 sem "+": 82 9 9166-9449 → 5582991669449. */
export function normalizarTelefoneBR(v: string | null | undefined): string {
  let d = soDigitos(v);
  if (!d) return "";
  if (d.startsWith("0")) d = d.replace(/^0+/, "");
  if (!d.startsWith("55") && (d.length === 10 || d.length === 11)) d = "55" + d;
  return d;
}

/**
 * Variantes com/sem o 9º dígito. A Meta às vezes entrega o número sem o 9 e os
 * envios usam com o 9 — sem isso a mesma pessoa vira duas conversas.
 */
export function variantesTelefoneBR(v: string): string[] {
  const d = normalizarTelefoneBR(v);
  if (!d.startsWith("55")) return [d];
  const ddd = d.slice(2, 4);
  const resto = d.slice(4);
  const out = new Set<string>([d]);
  if (resto.length === 9 && resto.startsWith("9")) out.add(`55${ddd}${resto.slice(1)}`);
  if (resto.length === 8) out.add(`55${ddd}9${resto}`);
  return Array.from(out);
}

// ─── Linhas ─────────────────────────────────────────────────────────────────

export async function linhaPorPhoneNumberId(phoneNumberId: string | null | undefined) {
  if (!phoneNumberId) return null;
  return prisma.linhaWhatsapp.findUnique({ where: { phoneNumberId: String(phoneNumberId) } });
}

export async function linhaPadrao() {
  return (
    (await prisma.linhaWhatsapp.findFirst({ where: { padrao: true, ativo: true } })) ??
    (await prisma.linhaWhatsapp.findFirst({ where: { ativo: true }, orderBy: { createdAt: "asc" } }))
  );
}

// ─── Envio ──────────────────────────────────────────────────────────────────

export type EnvioResultado = { ok: boolean; waId?: string; error?: string };

export async function enviarTexto(
  phoneNumberId: string,
  para: string,
  texto: string,
): Promise<EnvioResultado> {
  const to = normalizarTelefoneBR(para);
  if (!to) return { ok: false, error: "Telefone inválido" };
  try {
    const d = await graphPost<{ messages?: { id: string }[] }>(`${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: texto },
    });
    return { ok: true, waId: d?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "falha" };
  }
}

/** Template aprovado (fora da janela de 24h só template passa). */
export async function enviarTemplate(
  phoneNumberId: string,
  para: string,
  nome: string,
  idioma = "pt_BR",
  componentes?: unknown[],
): Promise<EnvioResultado> {
  const to = normalizarTelefoneBR(para);
  if (!to) return { ok: false, error: "Telefone inválido" };
  try {
    const d = await graphPost<{ messages?: { id: string }[] }>(`${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: nome, language: { code: idioma }, ...(componentes ? { components: componentes } : {}) },
    });
    return { ok: true, waId: d?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "falha" };
  }
}

export async function marcarComoLida(phoneNumberId: string, waId: string) {
  try {
    await graphPost(`${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: waId,
    });
  } catch {
    /* best-effort */
  }
}

/** Mídia recebida chega por id — URL temporária exige o mesmo Bearer. */
export async function baixarMidia(mediaId: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const token = await metaToken();
  if (!token) return null;
  try {
    const meta = await graphGet<{ url?: string; mime_type?: string }>(mediaId, token);
    if (!meta?.url) return null;
    const r = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    return { bytes: Buffer.from(await r.arrayBuffer()), mime: meta.mime_type || "application/octet-stream" };
  } catch {
    return null;
  }
}

/** Inscreve o app nos webhooks da WABA (sem isso o inbound nunca chega). */
export async function inscreverWebhookWaba(wabaId: string): Promise<boolean> {
  try {
    const sub = await graphGet<{ data?: unknown[] }>(`${wabaId}/subscribed_apps`);
    if ((sub?.data ?? []).length > 0) return true;
    await graphPost(`${wabaId}/subscribed_apps`, {});
    return true;
  } catch {
    return false;
  }
}

// ─── Mídia de saída ─────────────────────────────────────────────────────────

export type TipoMidiaWA = "image" | "document" | "video" | "audio";

export function tipoMidiaDoMime(mime: string): TipoMidiaWA {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

/** Sobe o arquivo para a Meta e devolve o media id (válido por 30 dias). */
export async function subirMidia(
  phoneNumberId: string,
  bytes: Buffer,
  mime: string,
  nome: string,
): Promise<{ ok: boolean; mediaId?: string; error?: string }> {
  const token = await metaToken();
  if (!token) return { ok: false, error: "Token da Meta ausente" };
  try {
    const fd = new FormData();
    fd.append("messaging_product", "whatsapp");
    fd.append("type", mime);
    fd.append("file", new Blob([new Uint8Array(bytes)], { type: mime }), nome);
    const r = await fetch(`${GRAPH_BASE}/${phoneNumberId}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
      cache: "no-store",
    });
    const d: any = await r.json().catch(() => ({}));
    if (!r.ok || !d?.id) return { ok: false, error: d?.error?.message || `Graph ${r.status}` };
    return { ok: true, mediaId: String(d.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "falha no upload" };
  }
}

export async function enviarMidia(
  phoneNumberId: string,
  para: string,
  midia: { mediaId: string; tipo: TipoMidiaWA; legenda?: string; nomeArquivo?: string },
): Promise<EnvioResultado> {
  const to = normalizarTelefoneBR(para);
  if (!to) return { ok: false, error: "Telefone inválido" };
  const corpo: Record<string, unknown> = { id: midia.mediaId };
  if (midia.legenda && midia.tipo !== "audio") corpo.caption = midia.legenda;
  if (midia.tipo === "document" && midia.nomeArquivo) corpo.filename = midia.nomeArquivo;
  try {
    const d = await graphPost<{ messages?: { id: string }[] }>(`${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: midia.tipo,
      [midia.tipo]: corpo,
    });
    return { ok: true, waId: d?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "falha" };
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

export type TemplateWA = {
  name: string;
  language: string;
  category: string;
  status: string;
  /** Texto do corpo com {{1}}, {{2}}… */
  body: string;
  header?: { format: string; text?: string } | null;
  footer?: string | null;
  /** Quantidade de variáveis do corpo. */
  variaveis: number;
  botoes: string[];
};

/** Templates APROVADOS da WABA (só esses passam fora da janela de 24h). */
export async function listarTemplates(wabaId: string): Promise<TemplateWA[]> {
  const d = await graphGet<{ data?: any[] }>(
    `${wabaId}/message_templates?status=APPROVED&limit=100&fields=name,language,status,category,components`,
  );
  return (d?.data ?? []).map((t: any) => {
    const comps: any[] = t.components ?? [];
    const body = comps.find((c) => c.type === "BODY")?.text ?? "";
    const header = comps.find((c) => c.type === "HEADER");
    const footer = comps.find((c) => c.type === "FOOTER")?.text ?? null;
    const botoes = (comps.find((c) => c.type === "BUTTONS")?.buttons ?? []).map((b: any) => b.text ?? b.type);
    const vars = new Set<string>();
    body.replace(/\{\{(\d+)\}\}/g, (_: string, n: string) => (vars.add(n), ""));
    return {
      name: t.name,
      language: t.language,
      category: t.category,
      status: t.status,
      body,
      header: header ? { format: header.format, text: header.text } : null,
      footer,
      variaveis: vars.size,
      botoes,
    };
  });
}

/** Substitui {{n}} pelo parâmetro n para gravar o texto renderizado no histórico. */
export function renderizarTemplate(body: string, params: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] ?? `{{${n}}}`);
}
