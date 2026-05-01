import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const colaborador = await prisma.colaborador.findUnique({
    where: { userId: session.user.id },
  });
  if (!colaborador) {
    return NextResponse.json(
      { error: "Usuário não vinculado a um colaborador" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const ponto = await prisma.pontoCampo.create({
    data: {
      colaboradorId: colaborador.id,
      obraId: params.id,
      tipo: "CHECKOUT",
      dataHora: new Date(),
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      observacao: parsed.data.observacao ?? null,
    },
  });

  return NextResponse.json(ponto, { status: 201 });
}
