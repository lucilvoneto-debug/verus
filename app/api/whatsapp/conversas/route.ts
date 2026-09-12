export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** GET ?q=&linhaId=&somenteNaoLidas=1&arquivadas=1&page=&pageSize= */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const linhaId = sp.get("linhaId");
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 40)));

  const where: Prisma.ConversaWAWhereInput = {
    arquivadaEm: sp.get("arquivadas") === "1" ? { not: null } : null,
  };
  if (linhaId) where.linhaId = linhaId;
  if (sp.get("somenteNaoLidas") === "1") where.naoLidas = { gt: 0 };
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { telefone: { contains: q.replace(/\D/g, "") || q } },
      { ultimaMensagem: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.conversaWA.count({ where }),
    prisma.conversaWA.findMany({
      where,
      orderBy: [{ ultimaMensagemEm: { sort: "desc", nulls: "last" } }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        linha: { select: { id: true, rotulo: true, numeroExibicao: true } },
        lead: { select: { id: true, status: true, origem: true, nome: true } },
      },
    }),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}
