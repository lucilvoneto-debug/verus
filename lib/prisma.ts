import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Garante um pool de conexão razoável. O DATABASE_URL do Supabase pooler
 * vinha com connection_limit=1 — o dashboard dispara ~13 queries em paralelo
 * e estourava o pool (P2024: timeout fetching connection) no cold start.
 * Aqui subimos pra 5 e damos mais tempo de espera.
 */
function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    const atual = Number(u.searchParams.get("connection_limit") || "0");
    if (!atual || atual < 5) u.searchParams.set("connection_limit", "5");
    if (!u.searchParams.get("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    return u.toString();
  } catch {
    return raw;
  }
}

function criar() {
  const url = databaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

export const prisma = globalForPrisma.prisma ?? criar();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
