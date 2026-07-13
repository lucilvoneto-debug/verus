import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularServico, type ItemMaterialCalculo } from "@/lib/orcamento/motor";

export const dynamic = "force-dynamic";

/**
 * Preview do motor de orçamento standalone: dado um serviço e uma
 * quantidade, roda o cálculo sem depender de um Orcamento/OrcamentoItem
 * já existente. Usado pela página /dashboard/orcamento/motor.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const servicoId = String(body?.servicoId ?? "");
  const quantidade = Number(body?.quantidade);

  if (!servicoId) return NextResponse.json({ error: "Serviço obrigatório" }, { status: 400 });
  if (!quantidade || quantidade <= 0) {
    return NextResponse.json({ error: "Quantidade inválida" }, { status: 400 });
  }

  const servico = await prisma.servico.findUnique({
    where: { id: servicoId },
    include: { materiais: { include: { material: true } } },
  });
  if (!servico) return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });

  const materiais: ItemMaterialCalculo[] = servico.materiais.map((sm) => ({
    materialId: sm.materialId,
    nome: sm.material.nome,
    unidade: sm.material.unidade,
    quantidadePorUnidade: sm.quantidade,
    precoUnitario: sm.material.precoMedio ?? sm.material.custoMedio,
  }));

  const resultado = calcularServico(servico, materiais, quantidade);

  return NextResponse.json({
    servico: { id: servico.id, nome: servico.nome, unidade: servico.unidade },
    resultado,
  });
}
