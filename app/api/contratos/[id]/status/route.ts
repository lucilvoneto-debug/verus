import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const validos = ["PENDENTE", "ASSINADO", "CANCELADO", "FINALIZADO"] as const;
type Status = (typeof validos)[number];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const status = body.status as Status | undefined;
  if (!status || !validos.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  const contrato = await prisma.contrato.update({
    where: { id: params.id },
    data: {
      status,
      assinadoEm: status === "ASSINADO" ? new Date() : undefined,
      dataFim: status === "FINALIZADO" ? new Date() : undefined,
    },
  });
  return NextResponse.json(contrato);
}
