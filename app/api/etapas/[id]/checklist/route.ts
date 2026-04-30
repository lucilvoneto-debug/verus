import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checklistToggleSchema } from "@/lib/validations/etapa";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = checklistToggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { index, done } = parsed.data;
  const etapa = await prisma.etapa.findUnique({ where: { id: params.id } });
  if (!etapa) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  let list: { nome: string; done: boolean }[] = [];
  if (etapa.checklist) {
    try {
      const arr = JSON.parse(etapa.checklist);
      if (Array.isArray(arr)) list = arr;
    } catch {
      list = [];
    }
  }
  if (index < 0 || index >= list.length) {
    return NextResponse.json({ error: "Índice inválido" }, { status: 400 });
  }
  list[index] = { ...list[index], done };
  const updated = await prisma.etapa.update({
    where: { id: params.id },
    data: { checklist: JSON.stringify(list) },
  });
  return NextResponse.json({ ...updated, checklist: list });
}
