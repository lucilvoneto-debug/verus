/** POST {tipo?, descricao} → nota/ligação/e-mail na timeline do lead. */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  tipo: z.enum(["NOTA", "LIGACAO", "EMAIL", "VISITA", "ORCAMENTO"]).default("NOTA"),
  descricao: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const ev = await prisma.leadEvento.create({
    data: { leadId: params.id, tipo: parsed.data.tipo, descricao: parsed.data.descricao, userId },
    include: { user: { select: { id: true, name: true } } },
  });
  return NextResponse.json(ev, { status: 201 });
}
