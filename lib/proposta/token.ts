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

function assinar(ns: string, id: string): string {
  return b64url(crypto.createHmac("sha256", segredo()).update(`${ns}:${id}`).digest());
}

/** Gera token público assinado pra um recurso (namespace evita reuso cruzado). */
export function gerarToken(ns: string, id: string): string {
  return `${b64url(Buffer.from(id))}.${assinar(ns, id)}`;
}

/** Valida o token do namespace e devolve o id, ou null se inválido/adulterado. */
export function lerToken(ns: string, token: string): string | null {
  const [idPart, sig] = (token || "").split(".");
  if (!idPart || !sig) return null;
  let id: string;
  try {
    id = deB64url(idPart).toString("utf-8");
  } catch {
    return null;
  }
  const a = Buffer.from(sig);
  const b = Buffer.from(assinar(ns, id));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

// wrappers por recurso
export const gerarTokenProposta = (orcamentoId: string) => gerarToken("proposta", orcamentoId);
export const lerTokenProposta = (token: string) => lerToken("proposta", token);
export const gerarTokenObra = (obraId: string) => gerarToken("obra", obraId);
export const lerTokenObra = (token: string) => lerToken("obra", token);
