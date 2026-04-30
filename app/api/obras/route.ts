import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obraSchema } from "@/lib/validations/obra";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function nextNumero() {
  const year = new Date().getFullYear();
  const prefix = `OB-${year}-`;
  const last = await prisma.obra.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const seq = last ? Number(last.numero.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const responsavelId = searchParams.get("responsavelId");
  const inicio = searchParams.get("inicio");
  const fim = searchParams.get("fim");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.ObraWhereInput = {};
  if (q) {
    where.OR = [
      { numero: { contains: q } },
      { nome: { contains: q } },
      { cliente: { nome: { contains: q } } },
    ];
  }
  if (status) where.status = status as Prisma.ObraWhereInput["status"];
  if (responsavelId) where.responsavelId = responsavelId;
  if (inicio || fim) {
    where.dataInicio = {};
    if (inicio) (where.dataInicio as Prisma.DateTimeFilter).gte = new Date(inicio);
    if (fim) (where.dataInicio as Prisma.DateTimeFilter).lte = new Date(fim);
  }

  const [total, rows] = await Promise.all([
    prisma.obra.count({ where }),
    prisma.obra.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, name: true } },
        etapas: { select: { id: true, status: true } },
      },
    }),
  ]);

  const data = rows.map((o) => {
    const total = o.etapas.length;
    const concl = o.etapas.filter((e) => e.status === "CONCLUIDA").length;
    const progresso = total > 0 ? Math.round((concl / total) * 100) : 0;
    return {
      id: o.id,
      numero: o.numero,
      nome: o.nome,
      status: o.status,
      dataInicio: o.dataInicio,
      previsaoTermino: o.previsaoTermino,
      cliente: o.cliente,
      responsavel: o.responsavel,
      etapasTotal: total,
      etapasConcluidas: concl,
      progresso,
    };
  });

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
    const parsed = obraSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const numero = await nextNumero();
    const obra = await prisma.obra.create({
      data: {
        numero,
        contratoId: data.contratoId,
        clienteId: data.clienteId,
        nome: data.nome,
        endereco: data.endereco,
        responsavelId: data.responsavelId,
        dataInicio: new Date(data.dataInicio),
        previsaoTermino: new Date(data.previsaoTermino),
        status: data.status,
        observacoes: data.observacoes || null,
      },
    });
    return NextResponse.json(obra, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar obra";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
