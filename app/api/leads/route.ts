/**
 * GET  → lista de leads (autenticado)
 * POST → cria lead. PÚBLICO quando vem do site (sem sessão): valida honeypot e
 *        origem SITE; com sessão, cadastro manual pelo CRM.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { criarLead } from "@/lib/crm/leads";
import { leadManualSchema, leadPublicoSchema } from "@/lib/validations/lead";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const status = sp.get("status");
  const origem = sp.get("origem");
  const responsavelId = sp.get("responsavelId");
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize") ?? 20)));

  const where: Prisma.LeadWhereInput = {};
  if (status) where.status = { in: status.split(",") };
  if (origem) where.origem = origem;
  if (responsavelId) where.responsavelId = responsavelId;
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { telefone: { contains: q.replace(/\D/g, "") || q } },
      { email: { contains: q, mode: "insensitive" } },
      { descricao: { contains: q, mode: "insensitive" } },
      { cliente: { nome: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cliente: { select: { id: true, nome: true } },
        responsavel: { select: { id: true, name: true } },
        conversa: { select: { id: true, naoLidas: true, ultimaMensagemEm: true } },
      },
    }),
  ]);
  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const body = await req.json().catch(() => ({}));

  if (!userId) {
    // ── Formulário público do site ──
    const parsed = leadPublicoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    if (d.site) return NextResponse.json({ ok: true }); // honeypot: finge sucesso
    const origem = d.gclid || d.utmSource === "google" ? "GOOGLE_ADS" : d.fbclid || d.utmSource === "meta" || d.utmSource === "facebook" || d.utmSource === "instagram" ? "META_ADS" : "SITE";
    const { lead, duplicado } = await criarLead({
      ...d,
      email: d.email || null,
      origem,
      descricao: d.descricao,
    });
    return NextResponse.json({ ok: true, id: lead.id, duplicado }, { status: 201 });
  }

  // ── Cadastro manual (CRM) ──
  const parsed = leadManualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const { lead, duplicado } = await criarLead({
    nome: d.nome,
    telefone: d.telefone || null,
    email: d.email || null,
    cidade: d.cidade,
    bairro: d.bairro,
    tipoImovel: d.tipoImovel,
    origem: d.origem,
    descricao: d.descricao,
    urgencia: d.urgencia,
    valorEstimado: d.valorEstimado ?? null,
    responsavelId: d.responsavelId || userId,
    userId,
  });
  if (d.clienteId && !lead.clienteId) {
    await prisma.lead.update({ where: { id: lead.id }, data: { clienteId: d.clienteId } });
  }
  return NextResponse.json({ ...lead, duplicado }, { status: 201 });
}
