import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function gerarNumero() {
  const ano = new Date().getFullYear();
  const prefix = `CTR-${ano}-`;
  const ultimos = await prisma.contrato.findMany({
    where: { numero: { startsWith: prefix } },
    select: { numero: true },
    orderBy: { numero: "desc" },
    take: 1,
  });
  const last = ultimos[0]?.numero;
  const next = last ? Number(last.split("-")[2]) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const orcamento = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: { contrato: true },
  });
  if (!orcamento) {
    return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  }
  if (orcamento.contrato) {
    return NextResponse.json(
      { error: "Este orçamento já possui contrato", contratoId: orcamento.contrato.id },
      { status: 400 }
    );
  }
  if (orcamento.status !== "APROVADO") {
    return NextResponse.json(
      { error: "Apenas orçamentos APROVADOS podem gerar contrato" },
      { status: 400 }
    );
  }

  const numero = await gerarNumero();
  const contrato = await prisma.contrato.create({
    data: {
      numero,
      orcamentoId: orcamento.id,
      clienteId: orcamento.clienteId,
      valor: orcamento.total,
      condicaoPagamento: orcamento.condicaoPagamento ?? "A definir",
      prazoExecucao: orcamento.prazoExecucao ?? "A definir",
      garantiaMeses: 60,
      escopo: orcamento.observacoes ?? "Conforme orçamento " + orcamento.numero,
      status: "PENDENTE",
    },
  });
  return NextResponse.json(contrato, { status: 201 });
}
