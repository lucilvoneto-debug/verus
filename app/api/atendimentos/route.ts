export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { atendimentoSchema } from "@/lib/validations/atendimento";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.trim();
  const status = sp.get("status");
  const canal = sp.get("canal");
  const urgencia = sp.get("urgencia");
  const clienteId = sp.get("clienteId");
  const responsavelId = sp.get("responsavelId");
  const abertos = sp.get("abertos") === "1";
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize") ?? 20)));

  const where: Prisma.AtendimentoWhereInput = {};
  if (q) where.OR = [{ descricao: { contains: q, mode: "insensitive" } }, { cliente: { nome: { contains: q, mode: "insensitive" } } }];
  if (status) where.status = status;
  if (abertos) where.status = { in: ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_CLIENTE"] };
  if (canal) where.canal = canal;
  if (urgencia) where.urgencia = urgencia;
  if (clienteId) where.clienteId = clienteId;
  if (responsavelId) where.responsavelId = responsavelId;

  const [total, data, resumo] = await Promise.all([
    prisma.atendimento.count({ where }),
    prisma.atendimento.findMany({
      where,
      orderBy: [{ status: "asc" }, { urgencia: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cliente: { select: { id: true, nome: true, telefone: true, whatsapp: true, cidade: true } },
        responsavel: { select: { id: true, name: true } },
        lead: { select: { id: true, status: true, origem: true } },
        _count: { select: { visitas: true } },
      },
    }),
    prisma.atendimento.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const porStatus: Record<string, number> = {};
  resumo.forEach((r) => (porStatus[r.status] = r._count._all));

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), porStatus });
}

export async function POST(req: NextRequest) {
  const parsed = atendimentoSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const a = await prisma.atendimento.create({
    data: {
      clienteId: d.clienteId,
      leadId: d.leadId || null,
      canal: d.canal,
      descricao: d.descricao,
      urgencia: d.urgencia,
      status: d.status,
      responsavelId: d.responsavelId,
      fotos: d.fotos && d.fotos.length ? JSON.stringify(d.fotos) : null,
    },
    include: { cliente: { select: { id: true, nome: true } }, responsavel: { select: { id: true, name: true } } },
  });
  return NextResponse.json(a, { status: 201 });
}
