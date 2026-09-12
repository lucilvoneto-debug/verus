export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { addMeses } from "@/lib/pos-venda";

const schema = z.object({
  obraId: z.string().min(1, "Obra obrigatória"),
  periodicidadeMeses: z.coerce.number().int().min(1).max(60).default(12),
  proximaData: z.string().optional(),
  valor: z.coerce.number().min(0).default(0),
  observacoes: z.string().optional().or(z.literal("")),
});

/** GET ?status=&vencendo=30&q= */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const status = sp.get("status");
  const vencendo = sp.get("vencendo");
  const q = sp.get("q")?.trim();
  const where: Prisma.PlanoManutencaoWhereInput = {};
  if (status) where.status = status;
  if (vencendo) {
    const lim = new Date();
    lim.setDate(lim.getDate() + Number(vencendo));
    where.proximaData = { lte: lim };
  }
  if (q) where.OR = [{ cliente: { nome: { contains: q, mode: "insensitive" } } }, { obra: { nome: { contains: q, mode: "insensitive" } } }, { obra: { numero: { contains: q, mode: "insensitive" } } }];

  const [data, porStatus] = await Promise.all([
    prisma.planoManutencao.findMany({
      where,
      orderBy: [{ status: "asc" }, { proximaData: "asc" }],
      include: {
        cliente: { select: { id: true, nome: true, whatsapp: true, telefone: true, cidade: true } },
        obra: { select: { id: true, numero: true, nome: true, dataConclusao: true } },
      },
      take: 500,
    }),
    prisma.planoManutencao.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const resumo: Record<string, number> = {};
  porStatus.forEach((r) => (resumo[r.status] = r._count._all));
  return NextResponse.json({ data, total: data.length, porStatus: resumo });
}

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const obra = await prisma.obra.findUnique({ where: { id: d.obraId }, select: { id: true, clienteId: true, dataConclusao: true } });
  if (!obra) return NextResponse.json({ error: "Obra não encontrada" }, { status: 404 });

  const base = obra.dataConclusao ?? new Date();
  const proxima = d.proximaData ? new Date(d.proximaData) : addMeses(base, d.periodicidadeMeses);

  const plano = await prisma.planoManutencao.create({
    data: {
      obraId: obra.id,
      clienteId: obra.clienteId,
      periodicidadeMeses: d.periodicidadeMeses,
      proximaData: proxima,
      valor: d.valor,
      observacoes: d.observacoes || null,
    },
  });
  return NextResponse.json(plano, { status: 201 });
}
