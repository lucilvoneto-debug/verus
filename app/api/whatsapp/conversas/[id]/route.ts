export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/** GET → conversa + mensagens (zera não lidas). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const conversa = await prisma.conversaWA.findUnique({
    where: { id: params.id },
    include: {
      linha: { select: { id: true, rotulo: true, numeroExibicao: true, phoneNumberId: true } },
      lead: { select: { id: true, status: true, origem: true, nome: true, clienteId: true } },
      mensagens: { orderBy: { createdAt: "asc" }, take: 500 },
    },
  });
  if (!conversa) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  if (conversa.naoLidas > 0) {
    await prisma.conversaWA.update({ where: { id: conversa.id }, data: { naoLidas: 0 } });
  }
  return NextResponse.json({ ...conversa, naoLidas: 0 });
}

const patchSchema = z.object({
  arquivar: z.boolean().optional(),
  responsavelId: z.string().nullable().optional(),
  nome: z.string().max(120).optional(),
  clienteId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const d = parsed.data;
  const conversa = await prisma.conversaWA.update({
    where: { id: params.id },
    data: {
      ...(d.arquivar !== undefined ? { arquivadaEm: d.arquivar ? new Date() : null } : {}),
      ...(d.responsavelId !== undefined ? { responsavelId: d.responsavelId } : {}),
      ...(d.nome !== undefined ? { nome: d.nome } : {}),
      ...(d.clienteId !== undefined ? { clienteId: d.clienteId } : {}),
    },
  });
  return NextResponse.json(conversa);
}
