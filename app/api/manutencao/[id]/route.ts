export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  periodicidadeMeses: z.coerce.number().int().min(1).max(60).optional(),
  proximaData: z.string().optional(),
  valor: z.coerce.number().min(0).optional(),
  status: z.enum(["ATIVO", "PAUSADO", "CANCELADO"]).optional(),
  observacoes: z.string().optional().or(z.literal("")),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const p = await prisma.planoManutencao.update({
    where: { id: params.id },
    data: {
      ...(d.periodicidadeMeses !== undefined ? { periodicidadeMeses: d.periodicidadeMeses } : {}),
      ...(d.proximaData ? { proximaData: new Date(d.proximaData), ultimoAvisoEm: null } : {}),
      ...(d.valor !== undefined ? { valor: d.valor } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.observacoes !== undefined ? { observacoes: d.observacoes || null } : {}),
    },
  });
  return NextResponse.json(p);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.planoManutencao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
