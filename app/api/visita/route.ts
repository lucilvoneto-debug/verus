import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { visitaSchema } from "@/lib/validations/visita";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tecnicoId = searchParams.get("tecnicoId");
  const dataIni = searchParams.get("dataIni");
  const dataFim = searchParams.get("dataFim");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.VisitaWhereInput = {};
  if (status) where.status = status as Prisma.VisitaWhereInput["status"];
  if (tecnicoId) where.tecnicoId = tecnicoId;
  if (dataIni || dataFim) {
    where.dataAgendada = {};
    if (dataIni) (where.dataAgendada as Prisma.DateTimeFilter).gte = new Date(dataIni);
    if (dataFim) (where.dataAgendada as Prisma.DateTimeFilter).lte = new Date(dataFim);
  }

  const [total, data] = await Promise.all([
    prisma.visita.count({ where }),
    prisma.visita.findMany({
      where,
      orderBy: { dataAgendada: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cliente: { select: { id: true, nome: true } },
        tecnico: { select: { id: true, name: true } },
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
    const parsed = visitaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const visita = await prisma.visita.create({
      data: {
        clienteId: data.clienteId,
        tecnicoId: data.tecnicoId,
        atendimentoId: data.atendimentoId || null,
        endereco: data.endereco,
        dataAgendada: new Date(data.dataAgendada),
        observacoes: data.observacoes || null,
      },
    });
    return NextResponse.json(visita, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar visita";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
