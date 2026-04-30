import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { servicoMaterialSchema } from "@/lib/validations/servico";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = servicoMaterialSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const created = await prisma.servicoMaterial.create({
      data: {
        servicoId: params.id,
        materialId: parsed.data.materialId,
        quantidade: parsed.data.quantidade,
      },
      include: { material: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao adicionar material";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
