import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contaReceberSchema } from "@/lib/validations/contaReceber";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const conta = await prisma.contaReceber.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nome: true } },
      contrato: { select: { id: true, numero: true } },
      obra: { select: { id: true, numero: true, nome: true } },
    },
  });
  if (!conta) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(conta);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = contaReceberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  // Boleto vivo no banco: valor e vencimento não mudam por cima (ver lib/inter/cobranca.ts).
  const antes = await prisma.contaReceber.findUnique({ where: { id: params.id } });
  const viva = await prisma.cobrancaBanco.findFirst({
    where: { contaReceberId: params.id, situacao: { in: ["EM_PROCESSAMENTO", "A_RECEBER", "ATRASADO"] } },
  });
  if (
    antes &&
    viva &&
    (Math.round(antes.valor * 100) !== Math.round(data.valor * 100) ||
      antes.vencimento.toISOString().slice(0, 10) !== new Date(data.vencimento).toISOString().slice(0, 10))
  ) {
    return NextResponse.json(
      { error: "Esta conta tem boleto em aberto no banco. Cancele o boleto primeiro (botão do boleto) e depois mude o valor ou o vencimento." },
      { status: 409 }
    );
  }
  const conta = await prisma.contaReceber.update({
    where: { id: params.id },
    data: {
      clienteId: data.clienteId,
      contratoId: data.contratoId || null,
      obraId: data.obraId || null,
      descricao: data.descricao,
      valor: data.valor,
      vencimento: new Date(data.vencimento),
      status: data.status,
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(conta);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const boletos = await prisma.cobrancaBanco.count({ where: { contaReceberId: params.id } });
  if (boletos) {
    return NextResponse.json(
      { error: "Esta conta já teve boleto emitido no banco e não pode ser apagada. Cancele o boleto e mude a conta para outro status." },
      { status: 409 }
    );
  }
  await prisma.contaReceber.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
