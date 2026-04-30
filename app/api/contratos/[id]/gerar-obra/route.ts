import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function gerarNumero() {
  const ano = new Date().getFullYear();
  const prefix = `OBR-${ano}-`;
  const ultimos = await prisma.obra.findMany({
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
  const contrato = await prisma.contrato.findUnique({
    where: { id: params.id },
    include: { obra: true, cliente: true },
  });
  if (!contrato) {
    return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
  }
  if (contrato.obra) {
    return NextResponse.json(
      { error: "Este contrato já possui obra", obraId: contrato.obra.id },
      { status: 400 }
    );
  }

  // Endereço a partir do cliente
  const enderecoBase =
    [
      contrato.cliente.logradouro,
      contrato.cliente.numero,
      contrato.cliente.bairro,
      contrato.cliente.cidade,
      contrato.cliente.uf,
    ]
      .filter(Boolean)
      .join(", ") || "A definir";

  // Responsável: usa o vendedor do orçamento (User existente) como fallback
  const orc = await prisma.orcamento.findUnique({
    where: { id: contrato.orcamentoId },
    select: { vendedorId: true },
  });
  if (!orc) {
    return NextResponse.json({ error: "Orçamento vinculado não encontrado" }, { status: 400 });
  }

  const numero = await gerarNumero();
  const obra = await prisma.obra.create({
    data: {
      numero,
      contratoId: contrato.id,
      clienteId: contrato.clienteId,
      nome: `Obra ${numero} — ${contrato.cliente.nome}`,
      endereco: enderecoBase,
      responsavelId: orc.vendedorId,
      dataInicio: new Date(),
      previsaoTermino: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "AGUARDANDO",
    },
  });
  return NextResponse.json(obra, { status: 201 });
}
