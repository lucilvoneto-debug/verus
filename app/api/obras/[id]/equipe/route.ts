import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { alocacaoEquipeSchema } from "@/lib/validations/obra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = alocacaoEquipeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const aloc = await prisma.alocacaoEquipe.create({
      data: {
        obraId: params.id,
        colaboradorId: data.colaboradorId,
        papel: data.papel,
        dataInicio: new Date(data.dataInicio),
        dataFim: data.dataFim ? new Date(data.dataFim) : null,
      },
      include: { colaborador: { select: { id: true, nome: true, funcao: true } } },
    });
    return NextResponse.json(aloc, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao alocar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params: _params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const alocacaoId = searchParams.get("alocacaoId");
  if (!alocacaoId) return NextResponse.json({ error: "alocacaoId obrigatório" }, { status: 400 });
  await prisma.alocacaoEquipe.delete({ where: { id: alocacaoId } });
  return NextResponse.json({ ok: true });
}
