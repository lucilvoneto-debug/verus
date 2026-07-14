/**
 * Helper de OAuth Google para o Verus ERP.
 *
 * Troca o refresh_token (salvo em Configuracao pelo callback) por um
 * access_token de curta duração, com cache em memória. Não lança —
 * retorna null se faltar credencial/token.
 *
 * Env necessárias (Vercel):
 *   - GOOGLE_OAUTH_CLIENT_ID
 *   - GOOGLE_OAUTH_CLIENT_SECRET
 */
import { prisma } from "@/lib/prisma";

/** Chave em Configuracao onde o refresh_token do Drive é gravado. */
export const DRIVE_CONFIG_KEY = "google_drive_refresh_token";

interface AccessTokenCache {
  token: string;
  exp: number;
}
const cache = new Map<string, AccessTokenCache>();

/** URL base pública do app (para montar o redirect_uri do OAuth). */
export function baseUrl(req: Request): string {
  const env = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (env && /^https?:\/\//.test(env)) return env.replace(/\/$/, "");
  const u = new URL(req.url);
  // Atrás do proxy da Vercel, confia no host encaminhado.
  const host = req.headers.get("x-forwarded-host") || u.host;
  const proto = req.headers.get("x-forwarded-proto") || u.protocol.replace(":", "");
  return `${proto}://${host}`;
}

/** Redirect URI do callback — precisa bater EXATO com o registrado no Google Cloud. */
export function driveRedirectUri(req: Request): string {
  return `${baseUrl(req)}/api/integracoes/google/callback`;
}

/** Lê um valor de Configuracao (fallback opcional de env). */
export async function getConfigValor(chave: string, envKey?: string): Promise<string | null> {
  if (envKey && process.env[envKey]) return process.env[envKey]!;
  try {
    const row = await prisma.configuracao.findUnique({ where: { chave } });
    return row?.valor ?? null;
  } catch {
    return null;
  }
}

/** Grava/atualiza um valor em Configuracao. */
export async function setConfigValor(chave: string, valor: string, descricao?: string) {
  await prisma.configuracao.upsert({
    where: { chave },
    create: { chave, valor, descricao },
    update: { valor, ...(descricao ? { descricao } : {}) },
  });
}

/**
 * Resolve um access_token Google a partir do refresh_token salvo.
 * Retorna null se faltar app/refresh_token.
 */
export async function getGoogleAccessToken(configKey = DRIVE_CONFIG_KEY): Promise<string | null> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = await getConfigValor(configKey);
  if (!clientId || !clientSecret || !refreshToken) return null;

  const c = cache.get(refreshToken);
  if (c && c.exp > Date.now() + 30_000) return c.token;

  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const d: { access_token?: string; expires_in?: number } = await r.json().catch(() => ({}));
    if (!r.ok || !d.access_token) return null;
    cache.set(refreshToken, {
      token: d.access_token,
      exp: Date.now() + Number(d.expires_in || 3600) * 1000,
    });
    return d.access_token;
  } catch {
    return null;
  }
}
