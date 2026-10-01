import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lancamentoSchema, dataDoDia } from "@/lib/caixa/validacoes";
import { extrato } from "@/lib/caixa/extrato";

export const dynamic = "force-dynamic";

/** Extrato da empresa: lançamentos + contas a pagar e a receber já pagas (ver lib/caixa/extrato). */
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const inicio = sp.get("inicio");
  const fim = sp.get("fim");
  const rows = await extrato({
    inicio: inicio ? dataDoDia(inicio) : undefined,
    fim: fim ? new Date(`${fim}T23:59:59-03:00`) : undefined,
    categoria: sp.get("categoria") || undefined,
    socioId: sp.get("socioId") || undefined,
    obraId: sp.get("obraId") || undefined,
    contaId: sp.get("contaId") || undefined,
  });

  const porCategoria: Record<string, { entrada: number; saida: number }> = {};
  for (const r of rows) {
    const c = (porCategoria[r.categoria] ??= { entrada: 0, saida: 0 });
    if (r.tipo === "ENTRADA") c.entrada += r.valor;
    else c.saida += r.valor;
  }
  return NextResponse.json({ data: rows.slice(0, 500), porCategoria });
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
