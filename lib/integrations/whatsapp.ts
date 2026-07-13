/**
 * Cliente WhatsApp (Z-API ou Evolution API).
 *
 * TODO: trocar por chamada real ao provedor.
 * Variáveis de env necessárias:
 *   WHATSAPP_PROVIDER  -> "zapi" | "evolution" | "none"
 *   WHATSAPP_TOKEN     -> token de cliente/instance
 *   WHATSAPP_INSTANCE  -> id da instância (Z-API) ou nome (Evolution)
 *
 * Endpoints do provedor:
 *   Z-API:     https://api.z-api.io/instances/{instance}/token/{token}/send-text
 *   Evolution: https://<host>/message/sendText/{instance}
 */

export type SendMessageResult = {
  ok: boolean;
  id?: string;
  error?: string;
};

function onlyDigits(phone: string): string {
  return phone.replace(/\D+/g, "");
}

export async function sendMessage(
  toPhone: string,
  text: string
): Promise<SendMessageResult> {
  const provider = (process.env.WHATSAPP_PROVIDER ?? "none").toLowerCase();
  const token = process.env.WHATSAPP_TOKEN ?? "";
  const instance = process.env.WHATSAPP_INSTANCE ?? "";
  const phone = onlyDigits(toPhone);

  if (!phone) {
    return { ok: false, error: "Telefone inválido" };
  }

  if (provider === "none" || !token || !instance) {
    // Modo mock — apenas loga.
    console.log("[whatsapp:mock] →", phone, "::", text);
    return { ok: true, id: "mock" };
  }

  try {
    if (provider === "zapi") {
      // TODO: validar payload conforme documentação atualizada da Z-API.
      const url = `https://api.z-api.io/instances/${instance}/token/${token}/send-text`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message: text }),
      });
      const json = (await res.json().catch(() => ({}))) as { messageId?: string; id?: string; error?: string };
      if (!res.ok) {
        return { ok: false, error: json.error ?? `HTTP ${res.status}` };
      }
      return { ok: true, id: json.messageId ?? json.id };
    }

    if (provider === "evolution") {
      const host = process.env.WHATSAPP_HOST ?? "";
      // TODO: confirmar host (por ex. https://api.evolution.local) — em produção
      // expor WHATSAPP_HOST como env separada.
      const url = `${host}/message/sendText/${instance}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: token,
        },
        body: JSON.stringify({ number: phone, text }),
      });
      const json = (await res.json().catch(() => ({}))) as { key?: { id?: string }; error?: string };
      if (!res.ok) {
        return { ok: false, error: json.error ?? `HTTP ${res.status}` };
      }
      return { ok: true, id: json.key?.id };
    }

    return { ok: false, error: `Provider não suportado: ${provider}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" };
  }
}

export function whatsappStatus(): { provider: string; connected: boolean } {
  const provider = (process.env.WHATSAPP_PROVIDER ?? "none").toLowerCase();
  const connected =
    provider !== "none" && !!process.env.WHATSAPP_TOKEN && !!process.env.WHATSAPP_INSTANCE;
  return { provider, connected };
}

function evoConfig() {
  return {
    host: (process.env.WHATSAPP_HOST ?? "").replace(/\/+$/, ""),
    token: process.env.WHATSAPP_TOKEN ?? "",
    instance: process.env.WHATSAPP_INSTANCE ?? "",
  };
}

export type InstanceState =
  | "conectado"
  | "conectando"
  | "desconectado"
  | "nao_configurado"
  | "erro";

/** Estado real da instância (Evolution). "open" = conectado. */
export async function getInstanceState(): Promise<{ state: InstanceState; detalhe?: string }> {
  const provider = (process.env.WHATSAPP_PROVIDER ?? "none").toLowerCase();
  const { host, token, instance } = evoConfig();
  if (provider !== "evolution" || !host || !token || !instance) {
    return { state: "nao_configurado" };
  }
  try {
    const res = await fetch(`${host}/instance/connectionState/${instance}`, {
      headers: { apikey: token },
      cache: "no-store",
    });
    if (!res.ok) return { state: "erro", detalhe: `HTTP ${res.status}` };
    const json = (await res.json().catch(() => ({}))) as { instance?: { state?: string } };
    const s = json.instance?.state;
    if (s === "open") return { state: "conectado" };
    if (s === "connecting") return { state: "conectando" };
    return { state: "desconectado", detalhe: s };
  } catch (err) {
    return { state: "erro", detalhe: err instanceof Error ? err.message : "falha" };
  }
}

/** Pega o QR code (base64) pra conectar/reconectar a instância (Evolution). */
export async function getQrCode(): Promise<{ ok: boolean; base64?: string; code?: string; error?: string }> {
  const provider = (process.env.WHATSAPP_PROVIDER ?? "none").toLowerCase();
  const { host, token, instance } = evoConfig();
  if (provider !== "evolution" || !host || !token || !instance) {
    return { ok: false, error: "WhatsApp não configurado. Defina WHATSAPP_PROVIDER=evolution + HOST/TOKEN/INSTANCE." };
  }
  try {
    const res = await fetch(`${host}/instance/connect/${instance}`, {
      headers: { apikey: token },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as { base64?: string; code?: string; error?: string };
    if (!res.ok) return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    return { ok: true, base64: json.base64, code: json.code };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "falha" };
  }
}
