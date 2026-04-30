import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { movimentacaoSchema } from "@/lib/validations/material";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = movimentacaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  let userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
    userId = admin.id;
  }

  const data = parsed.data;
  const material = await prisma.material.findUnique({ where: { id: params.id } });
  if (!material) return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });

  let novoEstoque = material.estoqueAtual;
  let novoCusto = material.custoMedio;

  if (data.tipo === "ENTRADA") {
    const denom = material.estoqueAtual + data.quantidade;
    novoCusto = denom > 0
      ? (material.estoqueAtual * material.custoMedio + data.quantidade * data.custoUnit) / denom
      : data.custoUnit;
    novoEstoque = material.estoqueAtual + data.quantidade;
  } else if (data.tipo === "SAIDA") {
    novoEstoque = material.estoqueAtual - data.quantidade;
  } else if (data.tipo === "AJUSTE") {
    novoEstoque = data.quantidade;
  }

  const result = await prisma.$transaction([
    prisma.movimentacaoEstoque.create({
      data: {
        materialId: material.id,
        tipo: data.tipo,
        quantidade: data.quantidade,
        custoUnit: data.custoUnit,
        obraId: data.obraId || null,
        observacao: data.observacao || null,
        userId,
      },
    }),
    prisma.material.update({
      where: { id: material.id },
      data: { estoqueAtual: novoEstoque, custoMedio: novoCusto },
    }),
  ]);

  return NextResponse.json({ movimentacao: result[0], material: result[1] }, { status: 201 });
}
