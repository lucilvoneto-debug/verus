import https from "node:https";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { decifrar } from "./cripto";

/**
 * Conversa com a API do Banco Inter (mesmo desenho do Retric, lib/inter.ts).
 * OAuth client_credentials com certificado em TODA chamada (mTLS).
 * As credenciais vêm da tabela IntegracaoBanco, cadastrada pela tela de Configurações.
 */

const BASE = "https://cdpj.partners.bancointer.com.br";

export const ESCOPOS = {
  EXTRATO: "extrato.read",
  COBRANCA: "boleto-cobranca.read boleto-cobranca.write",
  PAGA_BOLETO: "pagamento-boleto.read pagamento-boleto.write",
  PAGA_PIX: "pagamento-pix.read pagamento-pix.write",
} as const;

export class InterErro extends Error {
  constructor(public status: number, public caminho: string, public corpo: string) {
    super(`Inter [${status}] ${caminho}: ${corpo}`);
    this.name = "InterErro";
  }
}

type Credenciais = { clientId: string; clientSecret: string; cert: string; chave: string; assinatura: string };

let cache: { cred: Credenciais; agente: https.Agent } | null = null;
const tokens = new Map<string, { token: string; expira: number }>();
const emVoo = new Map<string, Promise<string>>();

/** Esquece credenciais e tokens (depois de salvar uma ligação nova). */
export function esquecerCredenciais() {
  cache?.agente.destroy();
  cache = null;
  tokens.clear();
}

export async function interConfigurado(): Promise<boolean> {
  const row = await prisma.integracaoBanco.findUnique({ where: { banco: "INTER" } });
  return !!row?.ativa;
}

async function carregar(): Promise<{ cred: Credenciais; agente: https.Agent }> {
  const row = await prisma.integracaoBanco.findUnique({ where: { banco: "INTER" } });
  if (!row || !row.ativa) throw new InterErro(0, "config", "Banco Inter ainda não ligado. Configure em Configurações → Banco Inter.");
  const assinatura = `${row.id}:${row.updatedAt.getTime()}`;
  if (cache && cache.cred.assinatura === assinatura) return cache;
  esquecerCredenciais();
  const cred: Credenciais = {
    clientId: row.clientId,
    clientSecret: decifrar(row.clientSecretCifr),
    cert: decifrar(row.certCifr),
    chave: decifrar(row.chaveCifr),
    assinatura,
  };
  cache = { cred, agente: new https.Agent({ cert: cred.cert, key: cred.chave, keepAlive: true }) };
  return cache;
}

function requisicao(
  agente: https.Agent,
  url: string,
  metodo: string,
  cabecalhos: Record<string, string>,
  corpo?: string,
): Promise<{ status: number; texto: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, port: 443, path: u.pathname + u.search, method: metodo, headers: cabecalhos, agent: agente, timeout: 30_000 },
      (res) => {
        const partes: Buffer[] = [];
        res.on("data", (c: Buffer) => partes.push(c));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, texto: Buffer.concat(partes).toString("utf8") }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("Inter não respondeu em 30 s")));
    req.on("error", reject);
    if (corpo) req.write(corpo);
    req.end();
  });
}

/** Token por conjunto de permissões. Reaproveita enquanto faltar mais de 5 min para vencer. */
async function token(escopo: string, teste?: { cred: Credenciais; agente: https.Agent }): Promise<string> {
  const { cred, agente } = teste ?? (await carregar());
  const k = `${cred.assinatura}|${escopo}`;
  const t = tokens.get(k);
  if (t && t.expira > Date.now() + 300_000) return t.token;
  const voando = emVoo.get(k);
  if (voando) return voando;
  const p = (async () => {
    const corpo = new URLSearchParams({ client_id: cred.clientId, client_secret: cred.clientSecret, grant_type: "client_credentials", scope: escopo }).toString();
    const r = await requisicao(agente, `${BASE}/oauth/v2/token`, "POST", {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": String(Buffer.byteLength(corpo)),
    }, corpo);
    if (r.status >= 400) throw new InterErro(r.status, "/oauth/v2/token", r.texto.slice(0, 500));
    const j = JSON.parse(r.texto) as { access_token: string; expires_in: number };
    tokens.set(k, { token: j.access_token, expira: Date.now() + j.expires_in * 1000 });
    return j.access_token;
  })();
  emVoo.set(k, p);
  try {
    return await p;
  } finally {
    emVoo.delete(k);
  }
}

export async function interChamar<T = unknown>(
  metodo: "GET" | "POST" | "PUT" | "DELETE",
  caminho: string,
  opcoes: { escopo: string; corpo?: unknown; query?: Record<string, string | number | undefined>; cabecalhos?: Record<string, string> },
): Promise<T> {
  const conexao = await carregar();
  const tk = await token(opcoes.escopo);
  let caminhoCompleto = caminho;
  if (opcoes.query) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(opcoes.query)) if (v !== undefined) q.set(k, String(v));
    if (q.toString()) caminhoCompleto += `?${q}`;
  }
  const corpo = opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined;
  const cab: Record<string, string> = {
    Authorization: `Bearer ${tk}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(opcoes.cabecalhos ?? {}),
  };
  if (corpo) cab["Content-Length"] = String(Buffer.byteLength(corpo));
  const r = await requisicao(conexao.agente, `${BASE}${caminhoCompleto}`, metodo, cab, corpo);
  if (r.status >= 400) throw new InterErro(r.status, caminho, r.texto.slice(0, 1000));
  try {
    return (r.texto ? JSON.parse(r.texto) : {}) as T;
  } catch {
    return r.texto as unknown as T;
  }
}

/** Data de validade do certificado (.crt). Lança erro se o texto não for certificado. */
export function validadeCertificado(pem: string): Date {
  return new Date(new crypto.X509Certificate(pem).validTo);
}

/**
 * Testa credenciais ainda não gravadas: pede um token de cada permissão
 * e lê o saldo. Não move dinheiro.
 */
export async function testarCredenciais(c: { clientId: string; clientSecret: string; cert: string; chave: string }) {
  const cred: Credenciais = { ...c, assinatura: `teste:${Date.now()}` };
  const agente = new https.Agent({ cert: c.cert, key: c.chave });
  const conexao = { cred, agente };
  const permissoes: Record<string, boolean> = {};
  const erros: string[] = [];
  for (const [nome, escopo] of Object.entries({ extrato: ESCOPOS.EXTRATO, cobranca: ESCOPOS.COBRANCA, pagaBoleto: ESCOPOS.PAGA_BOLETO, pagaPix: ESCOPOS.PAGA_PIX })) {
    try {
      await token(escopo, conexao);
      permissoes[nome] = true;
    } catch (e) {
      permissoes[nome] = false;
      erros.push(`${nome}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  let saldo: number | null = null;
  if (permissoes.extrato) {
    const tk = await token(ESCOPOS.EXTRATO, conexao);
    const r = await requisicao(agente, `${BASE}/banking/v2/saldo`, "GET", { Authorization: `Bearer ${tk}`, Accept: "application/json" });
    if (r.status < 400) saldo = Number(JSON.parse(r.texto).disponivel ?? 0);
    else erros.push(`saldo: ${r.status} ${r.texto.slice(0, 200)}`);
  }
  agente.destroy();
  for (const k of Array.from(tokens.keys())) if (k.startsWith(cred.assinatura)) tokens.delete(k);
  return { permissoes, saldo, erros };
}
