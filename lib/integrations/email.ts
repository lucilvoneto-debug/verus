/**
 * E-mail transacional via Resend (REST, sem SDK).
 *
 *   RESEND_API_KEY   chave da API (re_…)
 *   EMAIL_FROM       remetente verificado, ex.: "Verus <contato@verusimpermeabilizacoes.com.br>"
 *   EMAIL_REPLY_TO   opcional
 *
 * Sem chave → modo mock: loga e devolve ok com id "mock" (mesmo contrato do WhatsApp).
 */

import { EMPRESA } from "@/lib/site/empresa";

export type EmailResult = { ok: boolean; id?: string; error?: string; mock?: boolean };

export function emailStatus(): { provider: string; connected: boolean; from: string | null } {
  const key = process.env.RESEND_API_KEY;
  return { provider: key ? "resend" : "none", connected: !!key && !!process.env.EMAIL_FROM, from: process.env.EMAIL_FROM ?? null };
}

export async function enviarEmail(input: {
  para: string | string[];
  assunto: string;
  html: string;
  texto?: string;
  anexos?: Array<{ nome: string; conteudo: Buffer; tipo?: string }>;
}): Promise<EmailResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const para = Array.isArray(input.para) ? input.para : [input.para];
  if (para.some((p) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p))) return { ok: false, error: "E-mail inválido" };

  if (!key || !from) {
    console.log("[email:mock] →", para.join(", "), "::", input.assunto);
    return { ok: true, id: "mock", mock: true };
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: para,
        subject: input.assunto,
        html: input.html,
        text: input.texto,
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
        attachments: input.anexos?.map((a) => ({ filename: a.nome, content: a.conteudo.toString("base64"), content_type: a.tipo })),
      }),
    });
    const d: { id?: string; message?: string; name?: string } = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: d.message || d.name || `Resend ${r.status}` };
    return { ok: true, id: d.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "falha no envio" };
  }
}

/** Layout simples e responsivo, cor da marca, rodapé com dados da empresa. */
export function layoutEmail(opts: { titulo: string; corpoHtml: string; botao?: { texto: string; url: string } }): string {
  const botao = opts.botao
    ? `<p style="margin:24px 0"><a href="${opts.botao.url}" style="background:#0B5FFF;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block">${opts.botao.texto}</a></p>
       <p style="font-size:12px;color:#6b7280">Se o botão não abrir, copie este link: <a href="${opts.botao.url}" style="color:#0B5FFF">${opts.botao.url}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;color:#111827">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px"><tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
      <tr><td style="background:#0A2540;color:#fff;padding:20px 28px;font-size:20px;font-weight:700">${EMPRESA.nome}</td></tr>
      <tr><td style="padding:28px">
        <h1 style="font-size:20px;margin:0 0 16px">${opts.titulo}</h1>
        <div style="font-size:15px;line-height:1.55">${opts.corpoHtml}</div>
        ${botao}
      </td></tr>
      <tr><td style="padding:16px 28px;background:#f9fafb;font-size:12px;color:#6b7280">
        ${EMPRESA.razao} · CNPJ ${EMPRESA.cnpj} · ${EMPRESA.telefoneFormatado} · ${EMPRESA.cidade}/${EMPRESA.uf}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}
