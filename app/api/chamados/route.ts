import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chamadoSchema } from "@/lib/validations/chamado";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clienteId = searchParams.get("clienteId");
  const garantiaId = searchParams.get("garantiaId");
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.ChamadoAssistenciaWhereInput = {};
  if (status) where.status = status as Prisma.ChamadoAssistenciaWhereInput["status"];
  if (clienteId) where.clienteId = clienteId;
  if (garantiaId) where.garantiaId = garantiaId;
  if (inicio || fim) {
    where.dataAbertura = {};
    if (inicio) (where.dataAbertura as Prisma.DateTimeFilter).gte = new Date(inicio);
    if (fim) (where.dataAbertura as Prisma.DateTimeFilter).lte = new Date(fim);
  }

  const [total, data] = await Promise.all([
    prisma.chamadoAssistencia.count({ where }),
    prisma.chamadoAssistencia.findMany({
      where,
      orderBy: { dataAbertura: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cliente: { select: { id: true, nome: true } },
        garantia: {
          select: {
            id: true,
            obra: { select: { id: true, numero: true, nome: true } },
          },
        },
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
    const parsed = chamadoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const chamado = await prisma.chamadoAssistencia.create({
      data: {
        garantiaId: data.garantiaId,
        clienteId: data.clienteId,
        descricao: data.descricao,
        fotos: data.fotos && data.fotos.length > 0 ? JSON.stringify(data.fotos) : null,
        tecnicoId: data.tecnicoId || null,
        observacoes: data.observacoes || null,
        status: "ABERTO",
      },
    });
    return NextResponse.json(chamado, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar chamado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
