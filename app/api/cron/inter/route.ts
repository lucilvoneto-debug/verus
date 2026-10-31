import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sincronizarInter } from "@/lib/inter/extrato";
import { atualizarCobrancasAbertas } from "@/lib/inter/cobranca";

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
 * Puxa o Inter sem ninguém abrir a tela (antes só puxava ao abrir Contas e saldos).
 * Faz o mesmo que o botão "Buscar agora": situação dos boletos em aberto, extrato e saldo.
 * Chamado de hora em hora pelo cron do servidor (/opt/retric/verus-inter-cron.sh).
 */
async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const integ = await prisma.integracaoBanco.findUnique({ where: { banco: "INTER" } });
  if (!integ?.ativa) return NextResponse.json({ ok: true, pulado: "Banco Inter desligado" });
  try {
    const cobrancas = await atualizarCobrancasAbertas().catch((e) => ({ erro: String(e) }));
    const extrato = await sincronizarInter();
    return NextResponse.json({ ok: true, extrato, cobrancas });
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).slice(0, 1000);
    await prisma.integracaoBanco.update({ where: { banco: "INTER" }, data: { ultimoErro: msg } }).catch(() => {});
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
