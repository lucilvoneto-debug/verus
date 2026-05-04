import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const orc = await prisma.orcamento.findFirst({
    where: { id: params.id, clienteId },
    select: { id: true, status: true, numero: true, vendedorId: true },
  });
  if (!orc) return NextResponse.json({ error: "Não encontrado" }, { status: 403 });

  if (!["ENVIADO", "EM_NEGOCIACAO", "RASCUNHO"].includes(orc.status)) {
    return NextResponse.json(
      { error: "Orçamento não pode ser aprovado neste status" },
      { status: 400 }
    );
  }

  const updated = await prisma.orcamento.update({
    where: { id: orc.id },
    data: { status: "APROVADO", aprovadoEm: new Date() },
  });

  await prisma.notificacao.create({
    data: {
      userId: orc.vendedorId,
      tipo: "ORCAMENTO_APROVADO_PORTAL",
      titulo: `Orçamento ${orc.numero} aprovado pelo cliente`,
      mensagem: `O cliente aprovou o orçamento ${orc.numero} pelo portal.`,
      link: `/dashboard/orcamento/${orc.id}`,
    },
  });

  return NextResponse.json(updated);
}
