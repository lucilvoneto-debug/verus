/** GET → leads agrupados por etapa (abertos + fechados dos últimos 30 dias) + resumo por origem. */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ETAPAS, ETAPAS_ABERTAS } from "@/lib/crm/leads";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const responsavelId = sp.get("responsavelId");
  const origem = sp.get("origem");
  const dias = Math.max(1, Number(sp.get("dias") ?? 30));
  const desde = new Date(Date.now() - dias * 86400000);

  const base: Prisma.LeadWhereInput = {
    ...(responsavelId ? { responsavelId } : {}),
    ...(origem ? { origem } : {}),
  };
  const where: Prisma.LeadWhereInput = {
    ...base,
    OR: [{ status: { in: ETAPAS_ABERTAS } }, { status: { in: ["GANHO", "PERDIDO"] }, statusEm: { gte: desde } }],
  };

  const [leads, porOrigem, ganhos] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: [{ statusEm: "desc" }, { createdAt: "desc" }],
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, name: true } },
        conversa: { select: { id: true, naoLidas: true, ultimaMensagemEm: true } },
      },
    }),
    prisma.lead.groupBy({ by: ["origem"], where: { ...base, createdAt: { gte: desde } }, _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["origem"], where: { ...base, status: "GANHO", statusEm: { gte: desde } }, _count: { _all: true }, _sum: { valorFechado: true } }),
  ]);

  const colunas = ETAPAS.map((e) => ({ ...e, leads: leads.filter((l) => l.status === e.value) }));
  const resumo = porOrigem.map((o) => {
    const g = ganhos.find((x) => x.origem === o.origem);
    return { origem: o.origem, leads: o._count._all, ganhos: g?._count._all ?? 0, receita: g?._sum.valorFechado ?? 0 };
  });

  return NextResponse.json({ colunas, resumo, dias });
}
