import { NextResponse } from "next/server";
import { InterErro } from "./cliente";

/** Erro do banco ou de regra → mensagem em português para a tela. */
export function respostaErro(e: unknown, status = 400) {
  if (e instanceof InterErro) {
    const texto =
      e.status === 0 ? e.corpo
      : e.status === 401 || e.status === 403 ? "O banco recusou a permissão. Confira se a integração no Inter tem essa permissão marcada."
      : `O banco recusou (código ${e.status}): ${e.corpo.slice(0, 300)}`;
    return NextResponse.json({ error: texto }, { status: 502 });
  }
  return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status });
}
