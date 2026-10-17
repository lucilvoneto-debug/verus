import { NextRequest, NextResponse } from "next/server";
import { exigir } from "@/lib/sessao";
import { classificar, classificarSchema, sugestoes } from "@/lib/inter/classificar";
import { respostaErro } from "@/lib/inter/rota";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { movId: string } }) {
  try {
    return NextResponse.json(await sugestoes(params.movId));
  } catch (e) {
    return respostaErro(e, 404);
  }
}

/** Diz o que é um movimento "Sem dono". */
export async function POST(req: NextRequest, { params }: { params: { movId: string } }) {
  const auth = await exigir("financeiro", "escrever");
  if (auth.erro) return auth.erro;
  const p = classificarSchema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  try {
    return NextResponse.json(await classificar(params.movId, p.data, auth.sessao.name ?? auth.sessao.email ?? undefined));
  } catch (e) {
    return respostaErro(e);
  }
}
