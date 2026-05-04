import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [obraAtiva, garantia, orcamentosPendentes, contasAbertas] = await Promise.all([
    prisma.obra.findFirst({
      where: { clienteId, status: { in: ["EM_ANDAMENTO", "ATRASADA", "AGUARDANDO"] } },
      orderBy: { dataInicio: "desc" },
      include: { etapas: true },
    }),
    prisma.garantia.findFirst({
      where: { clienteId, status: "ATIVA" },
      orderBy: { dataFim: "asc" },
    }),
    prisma.orcamento.findMany({
      where: { clienteId, status: { in: ["ENVIADO", "EM_NEGOCIACAO"] } },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.contaReceber.findMany({
      where: { clienteId, status: { in: ["ABERTA", "ATRASADA", "PARCIAL"] } },
      orderBy: { vencimento: "asc" },
    }),
  ]);

  return NextResponse.json({ obraAtiva, garantia, orcamentosPendentes, contasAbertas });
}
