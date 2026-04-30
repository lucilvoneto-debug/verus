import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const validos = ["RASCUNHO", "ENVIADO", "APROVADO", "RECUSADO", "VENCIDO"] as const;
type Status = (typeof validos)[number];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body.status as Status | undefined;
  if (!status || !validos.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  const orcamento = await prisma.orcamento.update({
    where: { id: params.id },
    data: {
      status,
      aprovadoEm: status === "APROVADO" ? new Date() : null,
    },
  });
  return NextResponse.json(orcamento);
}
