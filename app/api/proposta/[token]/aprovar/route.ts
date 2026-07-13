import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerTokenProposta } from "@/lib/proposta/token";

export const dynamic = "force-dynamic";

/**
 * Aceite público da proposta pela construtora (sem login).
 * Registra quem aprovou (nome/doc/IP/data) no campo observações — trilha
 * de aceite sem precisar mexer no schema.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const id = lerTokenProposta(params.token);
  if (!id) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const acao = body.acao === "recusar" ? "RECUSADO" : "APROVADO";
  const nome = (body.nome || "").toString().trim().slice(0, 120);
  const doc = (body.documento || "").toString().trim().slice(0, 40);
  if (acao === "APROVADO" && !nome) {
    return NextResponse.json({ error: "Informe seu nome para aprovar." }, { status: 400 });
  }

  const o = await prisma.orcamento.findUnique({ where: { id }, select: { status: true, observacoes: true } });
  if (!o) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
  if (o.status === "APROVADO") return NextResponse.json({ error: "Proposta já foi aprovada." }, { status: 409 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const carimbo = `\n\n[${acao} via link em ${new Date().toISOString()}] por ${nome || "—"}${doc ? ` (${doc})` : ""} · IP ${ip}`;

  await prisma.orcamento.update({
    where: { id },
    data: {
      status: acao,
      aprovadoEm: acao === "APROVADO" ? new Date() : null,
      observacoes: (o.observacoes || "") + carimbo,
    },
  });

  return NextResponse.json({ ok: true, status: acao });
}
