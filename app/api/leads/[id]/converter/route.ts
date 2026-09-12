/**
 * POST → transforma o lead em Cliente (ou vincula a um existente por telefone).
 * Body opcional: {tipo, documento, categoria}. Sem documento, gera um provisório
 * ("LEAD-<id>") porque Cliente.documento é único e obrigatório.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  tipo: z.enum(["PF", "PJ"]).default("PF"),
  documento: z.string().optional(),
  categoria: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });
  if (lead.clienteId) {
    const c = await prisma.cliente.findUnique({ where: { id: lead.clienteId }, select: { id: true, nome: true } });
    return NextResponse.json({ cliente: c, jaExistia: true });
  }

  const documento = parsed.data.documento?.replace(/\D/g, "") || `LEAD-${lead.id.slice(-10).toUpperCase()}`;
  const categoriaPorImovel: Record<string, string> = {
    CONDOMINIO: "CONDOMINIO", COMERCIAL: "EMPRESA", INDUSTRIA: "INDUSTRIA", OBRA: "CONSTRUTORA",
  };
  const cliente = await prisma.cliente.upsert({
    where: { documento },
    create: {
      tipo: parsed.data.tipo,
      nome: lead.nome ?? `Lead ${lead.telefone ?? lead.id.slice(-6)}`,
      documento,
      email: lead.email,
      telefone: lead.telefone,
      whatsapp: lead.telefone,
      cidade: lead.cidade,
      bairro: lead.bairro,
      categoria: parsed.data.categoria ?? categoriaPorImovel[lead.tipoImovel ?? ""] ?? "RESIDENCIAL",
      observacoes: `Origem: ${lead.origem}. ${lead.descricao}`.slice(0, 1000),
    },
    update: {},
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      clienteId: cliente.id,
      eventos: { create: { tipo: "CONVERSAO", descricao: `Virou cliente: ${cliente.nome}`, userId } },
    },
  });
  if (lead.conversaId) {
    await prisma.conversaWA.update({ where: { id: lead.conversaId }, data: { clienteId: cliente.id } }).catch(() => null);
  }
  return NextResponse.json({ cliente, jaExistia: false }, { status: 201 });
}
