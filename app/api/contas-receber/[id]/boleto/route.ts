import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigir } from "@/lib/sessao";
import { gerarCobranca } from "@/lib/inter/cobranca";
import { respostaErro } from "@/lib/inter/rota";

export const dynamic = "force-dynamic";

/** Histórico de boletos da conta (inclusive cancelados). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lista = await prisma.cobrancaBanco.findMany({ where: { contaReceberId: params.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: lista });
}

/** Gera boleto com PIX no Inter para o que falta receber. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await exigir("financeiro", "escrever");
  if (auth.erro) return auth.erro;
  const body = await req.json().catch(() => ({}));
  try {
    const cob = await gerarCobranca({ contaReceberId: params.id, vencimento: String(body.vencimento ?? ""), usuario: auth.sessao.name ?? auth.sessao.email ?? undefined });
    return NextResponse.json(cob, { status: 201 });
  } catch (e) {
    return respostaErro(e);
  }
}
