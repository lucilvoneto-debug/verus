import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contaFinanceiraSchema, saldoContaSchema, dataDoDia } from "@/lib/caixa/validacoes";
import { saldosDasContas } from "@/lib/caixa/saldos";

export const dynamic = "force-dynamic";

export async function GET() {
  const contas = await saldosDasContas();
  const total = contas.reduce((s, c) => s + c.saldo, 0);
  return NextResponse.json({ contas, total });
}

/** Cria conta nova ou registra um saldo conferido ({ contaId, data, saldo }). */
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body?.contaId) {
    const p = saldoContaSchema.safeParse(body);
    if (!p.success) return NextResponse.json({ error: "Dados inválidos", issues: p.error.flatten() }, { status: 400 });
    const s = await prisma.saldoConta.create({
      data: { contaId: p.data.contaId, data: dataDoDia(p.data.data), saldo: p.data.saldo, fonte: p.data.fonte ?? "conferido na tela" },
    });
    return NextResponse.json(s, { status: 201 });
  }
  const p = contaFinanceiraSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Dados inválidos", issues: p.error.flatten() }, { status: 400 });
  const conta = await prisma.contaFinanceira.create({ data: { nome: p.data.nome, banco: p.data.banco ?? null, observacoes: p.data.observacoes ?? null } });
  return NextResponse.json(conta, { status: 201 });
}
