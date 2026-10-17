import { NextRequest, NextResponse } from "next/server";
import { exigir } from "@/lib/sessao";
import { atualizarCobranca, cancelarCobranca, pdfCobranca } from "@/lib/inter/cobranca";
import { respostaErro } from "@/lib/inter/rota";

export const dynamic = "force-dynamic";

/** PDF do boleto (vem do banco na hora). */
export async function GET(_req: NextRequest, { params }: { params: { cobId: string } }) {
  try {
    const pdf = await pdfCobranca(params.cobId);
    return new NextResponse(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="boleto-verus.pdf"` },
    });
  } catch (e) {
    return respostaErro(e);
  }
}

/** Consulta agora no banco se foi pago. */
export async function POST(_req: NextRequest, { params }: { params: { cobId: string } }) {
  try {
    return NextResponse.json(await atualizarCobranca(params.cobId));
  } catch (e) {
    return respostaErro(e);
  }
}

/** Cancela o boleto no banco. O registro continua guardado com o motivo. */
export async function PATCH(req: NextRequest, { params }: { params: { cobId: string } }) {
  const auth = await exigir("financeiro", "escrever");
  if (auth.erro) return auth.erro;
  const body = await req.json().catch(() => ({}));
  try {
    return NextResponse.json(await cancelarCobranca(params.cobId, String(body.motivo ?? "")));
  } catch (e) {
    return respostaErro(e);
  }
}
