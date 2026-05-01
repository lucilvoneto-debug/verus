import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { garantiaSchema } from "@/lib/validations/garantia";

export const dynamic = "force-dynamic";

function computeStatus(dataFim: Date, currentStatus: string): string {
  if (currentStatus === "ACIONADA") return "ACIONADA";
  if (dataFim < new Date()) return "EXPIRADA";
  return "ATIVA";
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const garantia = await prisma.garantia.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      obra: true,
      chamados: {
        orderBy: { dataAbertura: "desc" },
        include: {
          tecnico: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!garantia) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json({
    ...garantia,
    status: computeStatus(garantia.dataFim, garantia.status),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = garantiaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const garantia = await prisma.garantia.update({
    where: { id: params.id },
    data: {
      obraId: data.obraId,
      clienteId: data.clienteId,
      dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
      dataFim: data.dataFim ? new Date(data.dataFim) : undefined,
      prazoMeses: data.prazoMeses,
      tipoGarantia: data.tipoGarantia,
      condicoes: data.condicoes ?? undefined,
      status: data.status,
    },
  });
  return NextResponse.json(garantia);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.garantia.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
