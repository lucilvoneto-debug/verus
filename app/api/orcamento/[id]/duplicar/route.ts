import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function gerarNumero() {
  const ano = new Date().getFullYear();
  const prefix = `ORC-${ano}-`;
  const ultimos = await prisma.orcamento.findMany({
    where: { numero: { startsWith: prefix } },
    select: { numero: true },
    orderBy: { numero: "desc" },
    take: 1,
  });
  const last = ultimos[0]?.numero;
  const next = last ? Number(last.split("-")[2]) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/**
 * Duplica um orçamento como NOVA versão/aditivo: copia itens, cliente e
 * condições num novo RASCUNHO. Serve pra revisar obra que mudou sem redigitar.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const orig = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: { itens: true },
  });
  if (!orig) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });

  const numero = await gerarNumero();
  const validade = new Date();
  validade.setDate(validade.getDate() + 15);

  const novo = await prisma.orcamento.create({
    data: {
      numero,
      clienteId: orig.clienteId,
      vendedorId: orig.vendedorId,
      dataValidade: validade,
      status: "RASCUNHO",
      subtotal: orig.subtotal,
      desconto: orig.desconto,
      total: orig.total,
      custoEstimado: orig.custoEstimado,
      margemPrevista: orig.margemPrevista,
      condicaoPagamento: orig.condicaoPagamento,
      prazoExecucao: orig.prazoExecucao,
      observacoes: `Revisão de ${orig.numero}.` + (orig.observacoes ? `\n\n${orig.observacoes}` : ""),
      itens: {
        create: orig.itens.map((it) => ({
          servicoId: it.servicoId,
          descricao: it.descricao,
          area: it.area,
          quantidade: it.quantidade,
          unidade: it.unidade,
          custoUnit: it.custoUnit,
          precoUnit: it.precoUnit,
          subtotal: it.subtotal,
        })),
      },
    },
  });

  return NextResponse.json({ id: novo.id, numero: novo.numero });
}
