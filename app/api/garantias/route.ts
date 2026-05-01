import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { garantiaSchema } from "@/lib/validations/garantia";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function computeStatus(dataFim: Date, currentStatus: string): string {
  if (currentStatus === "ACIONADA") return "ACIONADA";
  const now = new Date();
  if (dataFim < now) return "EXPIRADA";
  return "ATIVA";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clienteId = searchParams.get("clienteId");
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.GarantiaWhereInput = {};
  if (clienteId) where.clienteId = clienteId;
  if (inicio || fim) {
    where.dataInicio = {};
    if (inicio) (where.dataInicio as Prisma.DateTimeFilter).gte = new Date(inicio);
    if (fim) (where.dataInicio as Prisma.DateTimeFilter).lte = new Date(fim);
  }

  const [total, rows] = await Promise.all([
    prisma.garantia.count({ where }),
    prisma.garantia.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cliente: { select: { id: true, nome: true } },
        obra: { select: { id: true, numero: true, nome: true } },
      },
    }),
  ]);

  let data = rows.map((g) => ({
    ...g,
    status: computeStatus(g.dataFim, g.status),
  }));

  if (status) data = data.filter((g) => g.status === status);

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = garantiaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const garantia = await prisma.garantia.create({
      data: {
        obraId: data.obraId,
        clienteId: data.clienteId,
        dataInicio: new Date(data.dataInicio),
        dataFim: new Date(data.dataFim),
        prazoMeses: data.prazoMeses,
        tipoGarantia: data.tipoGarantia,
        condicoes: data.condicoes || null,
        status: data.status,
      },
    });
    return NextResponse.json(garantia, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar garantia";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
