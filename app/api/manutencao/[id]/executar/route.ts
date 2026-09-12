/**
 * POST { data?, abrirAtendimento? } → marca a manutenção como feita:
 * ultimaExecucao = data, proximaData = data + periodicidade, zera aviso.
 * Opcionalmente abre um Atendimento para a equipe agendar a visita.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessaoAtual } from "@/lib/sessao";
import { addMeses } from "@/lib/pos-venda";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const data = body.data ? new Date(body.data) : new Date();
  const plano = await prisma.planoManutencao.findUnique({ where: { id: params.id }, include: { obra: { select: { numero: true, nome: true } } } });
  if (!plano) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const atualizado = await prisma.planoManutencao.update({
    where: { id: plano.id },
    data: { ultimaExecucao: data, proximaData: addMeses(data, plano.periodicidadeMeses), ultimoAvisoEm: null, status: "ATIVO" },
  });

  let atendimentoId: string | null = null;
  if (body.abrirAtendimento) {
    const sessao = await sessaoAtual();
    if (sessao) {
      const a = await prisma.atendimento.create({
        data: {
          clienteId: plano.clienteId,
          canal: "TELEFONE",
          descricao: `Manutenção preventiva — obra ${plano.obra.numero} · ${plano.obra.nome}. Agendar visita de manutenção.`,
          urgencia: "MEDIA",
          status: "ABERTO",
          responsavelId: sessao.id,
        },
      });
      atendimentoId = a.id;
    }
  }
  return NextResponse.json({ ...atualizado, atendimentoId });
}
