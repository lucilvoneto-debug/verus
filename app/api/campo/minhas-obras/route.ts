import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const colaborador = await prisma.colaborador.findUnique({
    where: { userId: session.user.id },
  });

  if (!colaborador) {
    return NextResponse.json({ data: [], colaborador: null });
  }

  const hoje = new Date();
  const alocacoes = await prisma.alocacaoEquipe.findMany({
    where: {
      colaboradorId: colaborador.id,
      OR: [{ dataFim: null }, { dataFim: { gte: hoje } }],
    },
    include: {
      obra: {
        include: {
          cliente: { select: { id: true, nome: true, telefone: true, whatsapp: true } },
          etapas: { orderBy: { ordem: "asc" } },
        },
      },
    },
    orderBy: { dataInicio: "desc" },
  });

  // dedup por obra
  const seen = new Set<string>();
  const obras = alocacoes
    .filter((a) => {
      if (seen.has(a.obraId)) return false;
      seen.add(a.obraId);
      return true;
    })
    .map((a) => {
      const total = a.obra.etapas.length;
      const concluidas = a.obra.etapas.filter((e) => e.status === "CONCLUIDA").length;
      const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
      return {
        id: a.obra.id,
        numero: a.obra.numero,
        nome: a.obra.nome,
        endereco: a.obra.endereco,
        status: a.obra.status,
        dataInicio: a.obra.dataInicio,
        previsaoTermino: a.obra.previsaoTermino,
        cliente: a.obra.cliente,
        papel: a.papel,
        progresso,
        totalEtapas: total,
        etapasConcluidas: concluidas,
      };
    });

  return NextResponse.json({
    data: obras,
    colaborador: { id: colaborador.id, nome: colaborador.nome, funcao: colaborador.funcao },
  });
}
