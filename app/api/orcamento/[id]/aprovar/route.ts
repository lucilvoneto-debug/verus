import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const validos = ["RASCUNHO", "ENVIADO", "APROVADO", "RECUSADO", "VENCIDO"] as const;
type Status = (typeof validos)[number];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body.status as Status | undefined;
  const motivo = (body.motivo || "").toString().trim().slice(0, 200);
  if (!status || !validos.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  // registra motivo de perda ao recusar
  let observacoesUpd: string | undefined;
  if (status === "RECUSADO" && motivo) {
    const atual = await prisma.orcamento.findUnique({ where: { id: params.id }, select: { observacoes: true } });
    observacoesUpd = (atual?.observacoes || "") + `\n\n[MOTIVO DA PERDA] ${motivo}`;
  }

  const orcamento = await prisma.orcamento.update({
    where: { id: params.id },
    data: {
      status,
      aprovadoEm: status === "APROVADO" ? new Date() : null,
      ...(observacoesUpd != null ? { observacoes: observacoesUpd } : {}),
    },
  });
  return NextResponse.json(orcamento);
}
