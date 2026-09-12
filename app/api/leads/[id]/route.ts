export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ETAPAS, mudarEtapa, type Etapa } from "@/lib/crm/leads";
import { normalizarTelefoneBR } from "@/lib/whatsapp/meta";
import { leadPatchSchema } from "@/lib/validations/lead";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, nome: true, documento: true, tipo: true, telefone: true, whatsapp: true, cidade: true } },
      responsavel: { select: { id: true, name: true } },
      eventos: { orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { id: true, name: true } } } },
      conversa: {
        include: {
          linha: { select: { id: true, rotulo: true, numeroExibicao: true } },
          mensagens: { orderBy: { createdAt: "asc" }, take: 300 },
        },
      },
      atendimentos: { select: { id: true, status: true, createdAt: true } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const parsed = leadPatchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  if (d.status) {
    if (!ETAPAS.some((e) => e.value === d.status)) return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
    await mudarEtapa(params.id, d.status as Etapa, { userId, motivoPerda: d.motivoPerda ?? null, valorFechado: d.valorFechado ?? null });
  }

  const data: Record<string, unknown> = {};
  if (d.nome !== undefined) data.nome = d.nome;
  if (d.telefone !== undefined) data.telefone = d.telefone ? normalizarTelefoneBR(d.telefone) : null;
  if (d.email !== undefined) data.email = d.email || null;
  if (d.cidade !== undefined) data.cidade = d.cidade;
  if (d.bairro !== undefined) data.bairro = d.bairro;
  if (d.tipoImovel !== undefined) data.tipoImovel = d.tipoImovel;
  if (d.origem !== undefined) data.origem = d.origem;
  if (d.descricao !== undefined) data.descricao = d.descricao;
  if (d.urgencia !== undefined) data.urgencia = d.urgencia;
  if (d.valorEstimado !== undefined) data.valorEstimado = d.valorEstimado;
  if (d.valorFechado !== undefined && !d.status) data.valorFechado = d.valorFechado;
  if (d.motivoPerda !== undefined && !d.status) data.motivoPerda = d.motivoPerda;
  if (d.responsavelId !== undefined) data.responsavelId = d.responsavelId;
  if (d.clienteId !== undefined) data.clienteId = d.clienteId;
  if (d.proximaAcao !== undefined) data.proximaAcao = d.proximaAcao;
  if (d.dataProximaAcao !== undefined) data.dataProximaAcao = d.dataProximaAcao ? new Date(d.dataProximaAcao) : null;

  const lead = Object.keys(data).length
    ? await prisma.lead.update({ where: { id: params.id }, data })
    : await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  if (d.responsavelId !== undefined && d.responsavelId) {
    const u = await prisma.user.findUnique({ where: { id: d.responsavelId }, select: { name: true } });
    await prisma.leadEvento.create({ data: { leadId: lead.id, tipo: "SISTEMA", descricao: `Responsável: ${u?.name ?? "—"}`, userId } });
  }
  return NextResponse.json(lead);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Somente ADMIN" }, { status: 403 });
  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
