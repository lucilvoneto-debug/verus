import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, ColaboradorFuncao } from "@prisma/client";

export const dynamic = "force-dynamic";

// Lista colaboradores (com User vinculado) — usado em selects de técnico/vendedor.
// Retorna o `userId` para uso direto em foreign keys (Visita.tecnicoId, Orcamento.vendedorId).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const funcoesParam = searchParams.get("funcoes"); // "TECNICO,ENGENHEIRO"
  const where: Prisma.ColaboradorWhereInput = {
    ativo: true,
    userId: { not: null },
  };
  if (funcoesParam) {
    const funcoes = funcoesParam
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean) as ColaboradorFuncao[];
    where.funcao = { in: funcoes };
  }
  const data = await prisma.colaborador.findMany({
    where,
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      funcao: true,
      userId: true,
    },
    take: 500,
  });
  return NextResponse.json({ data });
}
