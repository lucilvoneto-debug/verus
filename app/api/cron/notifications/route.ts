import { NextRequest, NextResponse } from "next/server";
import { runAllChecks } from "@/lib/notifications";
import { processarGatilhosClima, processarManutencoes } from "@/lib/pos-venda";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runAllChecks();
    // Pós-venda no mesmo cron (plano Hobby da Vercel limita a 2 crons diários).
    const manutencao = await processarManutencoes().catch((e) => ({ erro: e instanceof Error ? e.message : "falha" }));
    const clima = await processarGatilhosClima().catch((e) => ({ erro: e instanceof Error ? e.message : "falha" }));
    return NextResponse.json({ ok: true, ...result, manutencao, clima });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
