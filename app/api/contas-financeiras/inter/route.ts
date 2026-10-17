import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sincronizarInter } from "@/lib/inter/extrato";
import { atualizarCobrancasAbertas } from "@/lib/inter/cobranca";
import { respostaErro } from "@/lib/inter/rota";

export const dynamic = "force-dynamic";

/** Saldo do banco e movimentos importados (últimos 60 dias). */
export async function GET(req: NextRequest) {
  const integ = await prisma.integracaoBanco.findUnique({ where: { banco: "INTER" } });
  if (!integ?.ativa) return NextResponse.json({ ligado: false });
  const situacao = new URL(req.url).searchParams.get("situacao") || undefined;
  const desde = new Date(Date.now() - 60 * 864e5);
  const [movimentos, contagem] = await Promise.all([
    prisma.movimentoBanco.findMany({
      where: { data: { gte: desde }, ...(situacao ? { situacao } : {}) },
      orderBy: [{ data: "desc" }, { createdAt: "desc" }],
      take: 300,
    }),
    prisma.movimentoBanco.groupBy({ by: ["situacao"], where: { data: { gte: desde } }, _count: true }),
  ]);
  const cont = Object.fromEntries(contagem.map((c) => [c.situacao, c._count]));
  return NextResponse.json({
    ligado: true,
    saldo: integ.saldo,
    saldoEm: integ.saldoEm,
    extratoSyncEm: integ.extratoSyncEm,
    ultimoErro: integ.ultimoErro,
    contagem: { semDono: cont.SEM_DONO ?? 0, reconhecidos: cont.RECONHECIDO ?? 0, ignorados: cont.IGNORADO ?? 0 },
    movimentos,
  });
}

/** Busca agora no banco: extrato, saldo e situação dos boletos em aberto. */
export async function POST() {
  try {
    const cobrancas = await atualizarCobrancasAbertas().catch((e) => ({ erro: String(e) }));
    const extrato = await sincronizarInter();
    return NextResponse.json({ ok: true, extrato, cobrancas });
  } catch (e) {
    await prisma.integracaoBanco
      .update({ where: { banco: "INTER" }, data: { ultimoErro: (e instanceof Error ? e.message : String(e)).slice(0, 1000) } })
      .catch(() => {});
    return respostaErro(e);
  }
}
