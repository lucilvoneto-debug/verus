import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fabricanteSchema } from "@/lib/validations/fabricante";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const ativo = searchParams.get("ativo");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where: Prisma.FabricanteWhereInput = {};
  if (q) where.nome = { contains: q };
  if (ativo === "true") where.ativo = true;
  if (ativo === "false") where.ativo = false;

  const [total, data] = await Promise.all([
    prisma.fabricante.count({ where }),
    prisma.fabricante.findMany({
      where,
      orderBy: { nome: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { produtos: true } } },
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
    const parsed = fabricanteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const fabricante = await prisma.fabricante.create({
      data: {
        nome: data.nome,
        ativo: data.ativo,
        catalogoSincronizado: data.catalogoSincronizado,
        fichaTecnicaUrl: data.fichaTecnicaUrl || null,
        fispqUrl: data.fispqUrl || null,
        normasTecnicas: data.normasTecnicas || null,
        garantiaAnosPadrao: data.garantiaAnosPadrao ?? null,
        observacoes: data.observacoes || null,
      },
    });
    return NextResponse.json(fabricante, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar fabricante";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
