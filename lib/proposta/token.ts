import crypto from "node:crypto";

/**
 * Token assinado (HMAC) pra link público de proposta.
 * Não guarda nada no banco: o token carrega o id do orçamento + assinatura,
 * então só quem tem o segredo do servidor consegue gerar um válido.
 */

function segredo(): string {
  return process.env.NEXTAUTH_SECRET || "verus-proposta-dev-secret";
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function deB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function assinar(id: string): string {
  return b64url(crypto.createHmac("sha256", segredo()).update(id).digest());
}

/** Gera o token público do orçamento. */
export function gerarTokenProposta(orcamentoId: string): string {
  return `${b64url(Buffer.from(orcamentoId))}.${assinar(orcamentoId)}`;
}

/** Valida o token e devolve o orcamentoId, ou null se inválido/adulterado. */
export function lerTokenProposta(token: string): string | null {
  const [idPart, sig] = (token || "").split(".");
  if (!idPart || !sig) return null;
  let id: string;
  try {
    id = deB64url(idPart).toString("utf-8");
  } catch {
    return null;
  }
  const esperado = assinar(id);
  // comparação em tempo constante
  const a = Buffer.from(sig);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}
