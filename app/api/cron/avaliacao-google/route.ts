import { NextRequest, NextResponse } from "next/server";
import { processarPedidosAvaliacao } from "@/lib/avaliacao-google";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret && headerSecret === secret) return true;
  const auth = req.headers.get("authorization");
  if (auth && auth === `Bearer ${secret}`) return true;
  return false;
}

/**
 * Pede avaliação no Google por WhatsApp para obra FINALIZADA nos últimos 30 dias
 * (regras em lib/avaliacao-google.ts). Nasce desligado: com
 * Configuracao "avaliacao_google.ativo" diferente de "true" responde que está
 * desligado e não envia nada.
 *
 * ?dry=1 → devolve quem receberia e a mensagem, sem enviar e sem carimbar
 * (funciona mesmo desligado, para conferir antes de ligar).
 * Chamado pelo cron do servidor (/opt/retric/verus-cron.sh) com x-cron-secret.
 */
async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = ["1", "true", "sim"].includes((req.nextUrl.searchParams.get("dry") ?? "").toLowerCase());
  try {
    const r = await processarPedidosAvaliacao({ dry });
    if (!r.ligado && !dry) {
      return NextResponse.json({ ok: true, pulado: "Pedido de avaliação no Google desligado", ...r });
    }
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).slice(0, 1000);
    console.error("[cron/avaliacao-google]", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
