import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { lancamentoSchema, dataDoDia } from "@/lib/caixa/validacoes";

export const dynamic = "force-dynamic";

/** Extrato da empresa: filtros por período, conta, categoria, sócio e obra. */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const where: Prisma.LancamentoCaixaWhereInput = {};
  const inicio = sp.get("inicio");
  const fim = sp.get("fim");
  if (inicio || fim) where.data = { ...(inicio ? { gte: new Date(inicio) } : {}), ...(fim ? { lte: new Date(fim + "T23:59:59") } : {}) };
  for (const campo of ["contaId", "categoria", "socioId", "obraId", "tipo"] as const) {
    const v = sp.get(campo);
    if (v) (where as Record<string, unknown>)[campo] = v;
  }

  const rows = await prisma.lancamentoCaixa.findMany({
    where,
    orderBy: [{ data: "desc" }, { createdAt: "desc" }],
    take: 500,
    include: {
      conta: { select: { id: true, nome: true } },
      socio: { select: { id: true, nome: true } },
      obra: { select: { id: true, nome: true } },
      cliente: { select: { id: true, nome: true } },
    },
  });

  const porCategoria: Record<string, { entrada: number; saida: number }> = {};
  for (const r of rows) {
    const c = (porCategoria[r.categoria] ??= { entrada: 0, saida: 0 });
    if (r.tipo === "ENTRADA") c.entrada += r.valor;
    else c.saida += r.valor;
  }
  return NextResponse.json({ data: rows, porCategoria });
}

export async function POST(req: NextRequest) {
  const parsed = lancamentoSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const criado = await prisma.lancamentoCaixa.create({
    data: {
      data: dataDoDia(d.data),
      tipo: d.tipo,
      valor: d.valor,
      descricao: d.descricao,
      categoria: d.categoria,
      contaId: d.contaId ?? null,
      socioId: d.socioId ?? null,
      obraId: d.obraId ?? null,
      clienteId: d.clienteId ?? null,
      favorecido: d.favorecido ?? null,
      forma: d.forma ?? null,
      fonte: d.fonte ?? "lançado na tela",
      incerto: d.incerto ?? false,
      observacoes: d.observacoes ?? null,
    },
  });
  return NextResponse.json(criado, { status: 201 });
}
