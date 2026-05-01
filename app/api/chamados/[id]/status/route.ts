import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const validos = ["ABERTO", "EM_ATENDIMENTO", "CONCLUIDO", "CANCELADO"] as const;
type Status = (typeof validos)[number];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body.status as Status | undefined;
  const custoReparo: number | undefined =
    typeof body.custoReparo === "number" ? body.custoReparo : undefined;

  if (!status || !validos.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const chamado = await prisma.chamadoAssistencia.update({
    where: { id: params.id },
    data: {
      status,
      dataConclusao: status === "CONCLUIDO" ? new Date() : undefined,
      custoReparo: status === "CONCLUIDO" && custoReparo !== undefined ? custoReparo : undefined,
    },
  });
  return NextResponse.json(chamado);
}
