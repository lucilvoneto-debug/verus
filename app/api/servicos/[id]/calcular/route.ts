import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularServico, type ItemMaterialCalculo } from "@/lib/orcamento/motor";

export const dynamic = "force-dynamic";

/**
 * Preview puro: calcula custo/preço do Serviço a partir dos materiais
 * vinculados para uma quantidade de referência. Não grava nada.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const quantidade = Number(body?.quantidade);
  if (!quantidade || quantidade <= 0) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
  }

  const servico = await prisma.servico.findUnique({
    where: { id: params.id },
    include: { materiais: { include: { material: true } } },
  });
  if (!servico) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const materiais: ItemMaterialCalculo[] = servico.materiais.map((sm) => ({
    materialId: sm.materialId,
    nome: sm.material.nome,
    unidade: sm.material.unidade,
    quantidadePorUnidade: sm.quantidade,
    precoUnitario: sm.material.precoMedio ?? sm.material.custoMedio,
  }));

  const resultado = calcularServico(servico, materiais, quantidade);

  return NextResponse.json(resultado);
}
