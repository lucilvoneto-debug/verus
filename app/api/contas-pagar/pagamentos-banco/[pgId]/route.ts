import { NextRequest, NextResponse } from "next/server";
import { exigir } from "@/lib/sessao";
import { desistirPagamento } from "@/lib/inter/pagamento";
import { respostaErro } from "@/lib/inter/rota";

export const dynamic = "force-dynamic";

/** Desiste de um pedido que ainda não saiu da conta (recuse também no app do Inter). */
export async function PATCH(_req: NextRequest, { params }: { params: { pgId: string } }) {
  const auth = await exigir("financeiro", "escrever");
  if (auth.erro) return auth.erro;
  try {
    return NextResponse.json(await desistirPagamento(params.pgId));
  } catch (e) {
    return respostaErro(e);
  }
}
