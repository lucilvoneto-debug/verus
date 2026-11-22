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

// ─── Entrega das mensagens neste sistema ────────────────────────────────────
//
// O aplicativo da Meta usado aqui é o mesmo de outro sistema, e o endereço
// padrão do aplicativo é o de lá. Inscrever a conta (WABA) sem dizer o
// endereço entregaria as conversas daqui naquele sistema, que responde
// cliente sozinho. Por isso a inscrição SEMPRE leva o endereço próprio, e
// nunca fica valendo sem a Meta confirmar que a entrega é aqui.

function motivoDoErro(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function graphDelete(path: string, token?: string | null): Promise<void> {
  const t = token ?? (await metaToken());
  if (!t) throw new Error("Token da Meta ausente");
  const r = await fetch(`${GRAPH_BASE}/${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${t}` },
    cache: "no-store",
  });
  if (!r.ok) {
    const d: any = await r.json().catch(() => ({}));
    throw new Error(d?.error?.message || `Graph ${r.status}`);
  }
}

/** Endereço DESTE sistema que recebe as mensagens da Meta (só vale https). */
export function enderecoWebhookProprio(): string | null {
  const base = (process.env.APP_URL || process.env.NEXTAUTH_URL || "").trim().replace(/\/+$/, "");
  return /^https:\/\/[^/]+$/.test(base) ? `${base}/api/webhooks/meta` : null;
}

/** Para onde a Meta entrega as mensagens do número: número > conta > aplicativo. */
export async function destinoDaEntrega(phoneNumberId: string): Promise<string | null> {
  const d = await graphGet<{
    webhook_configuration?: { phone_number?: string; whatsapp_business_account?: string; application?: string };
  }>(`${phoneNumberId}?fields=webhook_configuration`);
  const c = d?.webhook_configuration ?? {};
  return c.phone_number || c.whatsapp_business_account || c.application || null;
}

/** Só leitura: as mensagens deste número chegam neste sistema? */
export async function entregaChegaAqui(phoneNumberId: string): Promise<boolean> {
  const aqui = enderecoWebhookProprio();
  if (!aqui) return false;
  try {
    return (await destinoDaEntrega(phoneNumberId)) === aqui;
  } catch {
    return false;
  }
}

export type ResultadoEntrega = { ok: boolean; motivo?: string };

/**
 * Faz as mensagens de UM número chegarem neste sistema, e só as dele.
 *  - o número sempre recebe o endereço próprio;
 *  - a conta (WABA) só é inscrita com endereço próprio quando TODOS os
 *    números dela são linhas daqui. Numa conta dividida com números de outro
 *    sistema, mexer na conta desviaria as conversas dos outros;
 *  - se a Meta não confirmar a entrega aqui, a inscrição feita agora é
 *    desfeita e a função devolve o motivo.
 */
export async function garantirEntregaPropria(wabaId: string, phoneNumberId: string): Promise<ResultadoEntrega> {
  const aqui = enderecoWebhookProprio();
  const verify = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!aqui) return { ok: false, motivo: "o endereço do sistema (APP_URL) não é https" };
  if (!verify) return { ok: false, motivo: "META_WEBHOOK_VERIFY_TOKEN ausente no servidor" };

  let contaSoNossa = false;
  try {
    const linhas = await prisma.linhaWhatsapp.findMany({ select: { phoneNumberId: true } });
    const nossos = new Set(linhas.map((l) => l.phoneNumberId));
    nossos.add(phoneNumberId);
    const d = await graphGet<{ data?: { id: string }[] }>(`${wabaId}/phone_numbers?fields=id&limit=100`);
    const ids = (d?.data ?? []).map((p) => String(p.id));
    contaSoNossa = ids.length > 0 && ids.every((id) => nossos.has(id));
  } catch (e) {
    return { ok: false, motivo: `não consegui listar os números da conta: ${motivoDoErro(e)}` };
  }

  const erros: string[] = [];
  let inscreviConta = false;
  if (contaSoNossa) {
    try {
      await graphPost(`${wabaId}/subscribed_apps`, { override_callback_uri: aqui, verify_token: verify });
      inscreviConta = true;
    } catch (e) {
      erros.push(`conta: ${motivoDoErro(e)}`);
    }
  } else {
    // Conta dividida: não inscreve nem muda nada nela. Só serve se o
    // aplicativo já estiver inscrito por quem cuida dos outros números.
    try {
      const sub = await graphGet<{ data?: unknown[] }>(`${wabaId}/subscribed_apps`);
      if (!(sub?.data ?? []).length) {
        return { ok: false, motivo: "a conta do WhatsApp tem números de outro sistema e o aplicativo não está inscrito nela" };
      }
    } catch (e) {
      return { ok: false, motivo: `não consegui conferir a inscrição da conta: ${motivoDoErro(e)}` };
    }
  }

  try {
    await graphPost(phoneNumberId, { webhook_configuration: { override_callback_uri: aqui, verify_token: verify } });
  } catch (e) {
    erros.push(`número: ${motivoDoErro(e)}`);
  }

  let destino: string | null = null;
  try {
    destino = await destinoDaEntrega(phoneNumberId);
  } catch (e) {
    erros.push(`conferência: ${motivoDoErro(e)}`);
  }
  if (destino === aqui) return { ok: true };

  // Não confirmou: desfaz o que foi inscrito agora, para nada ir ao endereço padrão.
  if (inscreviConta) await graphDelete(`${wabaId}/subscribed_apps`).catch(() => null);
  return {
    ok: false,
    motivo: `a Meta não confirmou a entrega neste sistema (${erros.join("; ") || `entrega em ${destino ?? "lugar nenhum"}`})`,
  };
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
