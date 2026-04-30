import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { etapaStatusSchema } from "@/lib/validations/etapa";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = etapaStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Status inválido", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const etapa = await prisma.etapa.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      dataRealizada: parsed.data.status === "CONCLUIDA" ? new Date() : null,
    },
  });
  return NextResponse.json(etapa);
}
