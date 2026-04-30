import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { medicaoSchema } from "@/lib/validations/medicao";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const obraId = searchParams.get("obraId");
  const status = searchParams.get("status");
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.MedicaoWhereInput = {};
  if (obraId) where.obraId = obraId;
  if (status) where.status = status as Prisma.MedicaoWhereInput["status"];
  if (inicio || fim) {
    where.dataReferencia = {};
    if (inicio) (where.dataReferencia as Prisma.DateTimeFilter).gte = new Date(inicio);
    if (fim) (where.dataReferencia as Prisma.DateTimeFilter).lte = new Date(fim);
  }

  const [total, data] = await Promise.all([
    prisma.medicao.count({ where }),
    prisma.medicao.findMany({
      where,
      orderBy: [{ dataReferencia: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        obra: { select: { id: true, numero: true, nome: true, clienteId: true } },
      },
    }),
  ]);

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
    const parsed = medicaoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const last = await prisma.medicao.findFirst({
      where: { obraId: data.obraId },
      orderBy: { numero: "desc" },
      select: { numero: true },
    });
    const numero = (last?.numero ?? 0) + 1;
    const medicao = await prisma.medicao.create({
      data: {
        obraId: data.obraId,
        numero,
        dataReferencia: new Date(data.dataReferencia),
        percentualExecutado: data.percentualExecutado,
        valor: data.valor,
        observacoes: data.observacoes || null,
      },
    });
    return NextResponse.json(medicao, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar medição";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
