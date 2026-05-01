import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  materialId: z.string().min(1),
  quantidade: z.number().positive(),
  observacao: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({ where: { id: data.materialId } });
      if (!material) throw new Error("Material não encontrado");

      const mov = await tx.movimentacaoEstoque.create({
        data: {
          materialId: data.materialId,
          tipo: "SAIDA",
          quantidade: data.quantidade,
          custoUnit: material.custoMedio,
          obraId: params.id,
          observacao: data.observacao ?? null,
          userId: session.user.id,
        },
      });

      await tx.material.update({
        where: { id: data.materialId },
        data: { estoqueAtual: { decrement: data.quantidade } },
      });

      return mov;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao registrar consumo";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
