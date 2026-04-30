import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { diarioObraSchema } from "@/lib/validations/obra";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = diarioObraSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    let autorId = data.autorId || "";
    if (!autorId) {
      const u = await prisma.user.findFirst({ where: { active: true }, select: { id: true } });
      if (!u) return NextResponse.json({ error: "Nenhum usuário disponível" }, { status: 400 });
      autorId = u.id;
    }

    const diario = await prisma.diarioObra.create({
      data: {
        obraId: params.id,
        data: new Date(data.data),
        autorId,
        descricao: data.descricao,
        condicaoTempo: data.condicaoTempo || null,
        problemas: data.problemas || null,
      },
      include: { autor: { select: { id: true, name: true } } },
    });
    return NextResponse.json(diario, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar entrada de diário";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
