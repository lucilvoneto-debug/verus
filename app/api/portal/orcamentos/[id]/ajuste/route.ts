import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  mensagem: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const orc = await prisma.orcamento.findFirst({
    where: { id: params.id, clienteId },
    select: {
      id: true,
      numero: true,
      cliente: { select: { nome: true } },
    },
  });
  if (!orc) return NextResponse.json({ error: "Não encontrado" }, { status: 403 });

  const destinatarios = await prisma.user.findMany({
    where: { active: true, role: { in: ["COMERCIAL", "ADMIN"] } },
    select: { id: true },
  });

  if (destinatarios.length > 0) {
    await prisma.notificacao.createMany({
      data: destinatarios.map((u) => ({
        userId: u.id,
        tipo: "ORCAMENTO_AJUSTE_PORTAL",
        titulo: `Cliente solicita ajuste no orçamento ${orc.numero}`,
        mensagem: `${orc.cliente.nome}: ${parsed.data.mensagem}`,
        link: `/dashboard/orcamento/${orc.id}`,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
