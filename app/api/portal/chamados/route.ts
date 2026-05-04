import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  garantiaId: z.string().min(1),
  descricao: z.string().min(1).max(2000),
  fotos: z.array(z.string().url()).optional(),
});

export async function GET() {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const chamados = await prisma.chamadoAssistencia.findMany({
    where: { clienteId },
    orderBy: { dataAbertura: "desc" },
  });
  return NextResponse.json(chamados);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const garantia = await prisma.garantia.findFirst({
    where: { id: parsed.data.garantiaId, clienteId },
    select: { id: true, status: true, obra: { select: { numero: true } } },
  });
  if (!garantia) return NextResponse.json({ error: "Garantia inválida" }, { status: 403 });
  if (garantia.status !== "ATIVA") {
    return NextResponse.json({ error: "Garantia não está ativa" }, { status: 400 });
  }

  const chamado = await prisma.chamadoAssistencia.create({
    data: {
      garantiaId: garantia.id,
      clienteId,
      descricao: parsed.data.descricao,
      fotos: parsed.data.fotos && parsed.data.fotos.length > 0 ? JSON.stringify(parsed.data.fotos) : null,
      status: "ABERTO",
    },
  });

  const destinatarios = await prisma.user.findMany({
    where: { active: true, role: { in: ["ADMIN", "SUPERVISOR"] } },
    select: { id: true },
  });
  if (destinatarios.length > 0) {
    await prisma.notificacao.createMany({
      data: destinatarios.map((u) => ({
        userId: u.id,
        tipo: "CHAMADO_ASSISTENCIA_PORTAL",
        titulo: `Novo chamado de assistência`,
        mensagem: `Obra ${garantia.obra.numero}: ${parsed.data.descricao.slice(0, 120)}`,
        link: `/dashboard/pos-venda/${chamado.id}`,
      })),
    });
  }

  return NextResponse.json(chamado, { status: 201 });
}
