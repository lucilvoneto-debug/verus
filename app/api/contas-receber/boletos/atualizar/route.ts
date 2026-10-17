import { NextResponse } from "next/server";
import { interConfigurado } from "@/lib/inter/cliente";
import { atualizarCobrancasAbertas } from "@/lib/inter/cobranca";
import { respostaErro } from "@/lib/inter/rota";

export const dynamic = "force-dynamic";

/** Pergunta ao banco quais boletos em aberto foram pagos e dá baixa. */
export async function POST() {
  if (!(await interConfigurado())) return NextResponse.json({ ligado: false });
  try {
    return NextResponse.json({ ligado: true, ...(await atualizarCobrancasAbertas()) });
  } catch (e) {
    return respostaErro(e);
  }
}
