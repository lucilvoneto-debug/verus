import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { exigir } from "@/lib/sessao";
import { normalizarPapel } from "@/lib/permissions";
import { pagarPeloInter } from "@/lib/inter/pagamento";
import { respostaErro } from "@/lib/inter/rota";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lista = await prisma.pagamentoBanco.findMany({ where: { contaPagarId: params.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: lista });
}

const schema = z.object({
  tipo: z.enum(["BOLETO", "PIX"]),
  destino: z.string().trim().min(5, "Cole o código de barras ou a chave PIX"),
  confirmacao: z.literal("PAGAR", { errorMap: () => ({ message: "Digite PAGAR para confirmar" }) }),
});

/** Manda o pagamento ao Inter. Só o administrador. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await exigir("financeiro", "escrever");
  if (auth.erro) return auth.erro;
  if (normalizarPapel(auth.sessao.role) !== "ADMIN") {
    return NextResponse.json({ error: "Só o administrador pode mandar pagamento ao banco." }, { status: 403 });
  }
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  try {
    const pg = await pagarPeloInter({
      contaPagarId: params.id,
      tipo: p.data.tipo,
      destino: p.data.destino,
      usuario: auth.sessao.name ?? auth.sessao.email ?? undefined,
    });
    return NextResponse.json(pg, { status: 201 });
  } catch (e) {
    return respostaErro(e);
  }
}
