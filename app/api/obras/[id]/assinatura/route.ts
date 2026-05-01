import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  dataUrl: z.string().min(20),
  nome: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const anexo = await prisma.anexo.create({
    data: {
      entidade: "Obra",
      entidadeId: params.id,
      nome: parsed.data.nome || "Assinatura cliente",
      url: parsed.data.dataUrl,
      tipo: "image/png",
      tamanho: 0,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(anexo, { status: 201 });
}
