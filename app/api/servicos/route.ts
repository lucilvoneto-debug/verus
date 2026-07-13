import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { servicoSchema } from "@/lib/validations/servico";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const unidade = searchParams.get("unidade");
  const ativo = searchParams.get("ativo");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.ServicoWhereInput = {};
  if (q) where.nome = { contains: q };
  if (unidade) where.unidade = unidade as Prisma.ServicoWhereInput["unidade"];
  if (ativo === "true") where.ativo = true;
  if (ativo === "false") where.ativo = false;

  const [total, data] = await Promise.all([
    prisma.servico.count({ where }),
    prisma.servico.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    const parsed = servicoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const servico = await prisma.servico.create({
      data: {
        nome: data.nome,
        descricao: data.descricao || null,
        unidade: data.unidade,
        custoPadrao: data.custoPadrao,
        precoPadrao: data.precoPadrao,
        tempoMedio: data.tempoMedio ?? null,
        observacoesTecnicas: data.observacoesTecnicas || null,
        ativo: data.ativo,
        percaPercent: data.percaPercent ?? null,
        maoDeObraPorUnidade: data.maoDeObraPorUnidade ?? null,
        equipamentosPorUnidade: data.equipamentosPorUnidade ?? null,
        episTransportePorUnidade: data.episTransportePorUnidade ?? null,
        bdiPercent: data.bdiPercent ?? null,
        impostosPercent: data.impostosPercent ?? null,
        lucroPercent: data.lucroPercent ?? null,
      },
    });
    return NextResponse.json(servico, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar serviço";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
