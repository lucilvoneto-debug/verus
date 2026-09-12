/**
 * Armazenamento de arquivos (foto de obra, documento, comprovante).
 *
 * Provedor escolhido por env, sem mudança de código:
 *   STORAGE_PROVIDER=db        (padrão) bytes na tabela Foto, servido por /api/foto/{id}
 *   STORAGE_PROVIDER=supabase  bucket público no Supabase Storage (REST, sem SDK)
 *       SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET (padrão "verus")
 *
 * O chamador recebe sempre uma URL pronta para <img src> / <a href>.
 * Tamanho: o cliente reduz imagem antes de subir (components/ui/UploadFoto.tsx);
 * aqui vale o teto MAX_BYTES para qualquer tipo.
 */

import { prisma } from "./prisma";

export const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export const MIMES_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/acad",
  "image/vnd.dwg",
  "application/dxf",
]);

export type ArquivoSalvo = { id: string; url: string; mime: string; tamanho: number };

export type SalvarInput = {
  bytes: Buffer;
  mime: string;
  nome?: string;
  contexto?: string; // "diario" | "etapa" | "visita" | "anexo" | "whatsapp"
  userId?: string | null;
};

function provider(): "db" | "supabase" {
  const p = (process.env.STORAGE_PROVIDER ?? "db").toLowerCase();
  if (p === "supabase" && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  return "db";
}

export function storageStatus(): { provider: string } {
  return { provider: provider() };
}

function extensao(mime: string, nome?: string): string {
  const daNome = nome?.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  if (daNome) return daNome;
  const mapa: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "text/csv": "csv",
    "text/plain": "txt",
  };
  return mapa[mime] ?? "bin";
}

function slug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function validarArquivo(mime: string, tamanho: number): string | null {
  if (!MIMES_PERMITIDOS.has(mime)) return `Tipo de arquivo não permitido: ${mime}`;
  if (tamanho <= 0) return "Arquivo vazio";
  if (tamanho > MAX_BYTES) return `Arquivo acima de ${Math.round(MAX_BYTES / 1024 / 1024)} MB`;
  return null;
}

export async function salvarArquivo(input: SalvarInput): Promise<ArquivoSalvo> {
  const erro = validarArquivo(input.mime, input.bytes.length);
  if (erro) throw new Error(erro);

  if (provider() === "supabase") {
    return salvarSupabase(input);
  }

  const foto = await prisma.foto.create({
    data: {
      mime: input.mime,
      dados: input.bytes,
      tamanho: input.bytes.length,
      contexto: input.contexto ?? null,
      criadoPorId: input.userId ?? null,
    },
    select: { id: true },
  });
  return { id: foto.id, url: `/api/foto/${foto.id}`, mime: input.mime, tamanho: input.bytes.length };
}

async function salvarSupabase(input: SalvarInput): Promise<ArquivoSalvo> {
  const base = process.env.SUPABASE_URL!.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const bucket = process.env.SUPABASE_BUCKET ?? "verus";
  const pasta = input.contexto ?? "geral";
  const nome = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao(input.mime, input.nome)}`;
  const caminho = `${pasta}/${slug(nome)}`;

  const r = await fetch(`${base}/storage/v1/object/${bucket}/${caminho}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": input.mime,
      "x-upsert": "false",
    },
    body: new Uint8Array(input.bytes),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`Supabase Storage ${r.status}: ${txt.slice(0, 200)}`);
  }
  return {
    id: caminho,
    url: `${base}/storage/v1/object/public/${bucket}/${caminho}`,
    mime: input.mime,
    tamanho: input.bytes.length,
  };
}

/** Lê um arquivo guardado no banco (provedor db). */
export async function lerArquivoDb(id: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const f = await prisma.foto.findUnique({ where: { id }, select: { dados: true, mime: true } });
  if (!f) return null;
  return { bytes: Buffer.from(f.dados), mime: f.mime };
}

/** Apaga o arquivo físico quando a URL aponta para o nosso storage. Best-effort. */
export async function apagarArquivoPorUrl(url: string): Promise<void> {
  const m = url.match(/^\/api\/foto\/([a-z0-9]+)$/i);
  if (m) {
    await prisma.foto.delete({ where: { id: m[1] } }).catch(() => undefined);
    return;
  }
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_BUCKET ?? "verus";
  if (base && key && url.startsWith(`${base}/storage/v1/object/public/${bucket}/`)) {
    const caminho = url.slice(`${base}/storage/v1/object/public/${bucket}/`.length);
    await fetch(`${base}/storage/v1/object/${bucket}/${caminho}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${key}`, apikey: key },
    }).catch(() => undefined);
  }
}
