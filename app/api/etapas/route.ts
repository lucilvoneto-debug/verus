import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { etapaSchema } from "@/lib/validations/etapa";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const obraId = searchParams.get("obraId");
  const status = searchParams.get("status");
  const responsavelId = searchParams.get("responsavelId");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where: Prisma.EtapaWhereInput = {};
  if (obraId) where.obraId = obraId;
  if (status) where.status = status as Prisma.EtapaWhereInput["status"];
  if (responsavelId) where.responsavelId = responsavelId;

  const [total, rows] = await Promise.all([
    prisma.etapa.count({ where }),
    prisma.etapa.findMany({
      where,
      orderBy: [{ obraId: "asc" }, { ordem: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        obra: { select: { id: true, numero: true, nome: true } },
        responsavel: { select: { id: true, name: true } },
      },
    }),
  ]);

  const data = rows.map((e) => {
    let fotosCount = 0;
    if (e.fotos) {
      try {
        const arr = JSON.parse(e.fotos);
        if (Array.isArray(arr)) fotosCount = arr.length;
      } catch {
        fotosCount = e.fotos.split(",").filter(Boolean).length;
      }
    }
    return {
      id: e.id,
      ordem: e.ordem,
      nome: e.nome,
      status: e.status,
      dataPrevista: e.dataPrevista,
      dataRealizada: e.dataRealizada,
      obra: e.obra,
      responsavel: e.responsavel,
      fotosCount,
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
    const parsed = etapaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const etapa = await prisma.etapa.create({
      data: {
        obraId: data.obraId,
        ordem: data.ordem,
        nome: data.nome,
        descricao: data.descricao || null,
        responsavelId: data.responsavelId || null,
        dataPrevista: new Date(data.dataPrevista),
        status: data.status,
        checklist: JSON.stringify(data.checklist ?? []),
        fotos: JSON.stringify(data.fotos ?? []),
        observacoes: data.observacoes || null,
      },
    });
    return NextResponse.json(etapa, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar etapa";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
