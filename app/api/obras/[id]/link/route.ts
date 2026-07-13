import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarTokenObra } from "@/lib/proposta/token";
import { sendMessage, whatsappStatus } from "@/lib/integrations/whatsapp";

export const dynamic = "force-dynamic";

async function nomeEmpresa() {
  const row = await prisma.configuracao.findFirst({ where: { chave: "empresa.nome" } });
  return row?.valor || "Verus Impermeabilização";
}

/**
 * Gera o link público de acompanhamento da obra e — se o WhatsApp estiver
 * conectado e o cliente tiver telefone — manda o link sozinho.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const o = await prisma.obra.findUnique({
    where: { id: params.id },
    select: { id: true, nome: true, cliente: { select: { nome: true, telefone: true } } },
  });
  if (!o) return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const url = `${origin}/obra/${gerarTokenObra(o.id)}`;

  let autoEnviado = false;
  let motivo: string | undefined;
  const wa = whatsappStatus();
  const telefone = o.cliente?.telefone?.trim();
  if (!wa.connected) {
    motivo = "WhatsApp não conectado (modo manual).";
  } else if (!telefone) {
    motivo = "Cliente sem telefone cadastrado.";
  } else {
    const empresa = await nomeEmpresa();
    const msg = `Olá ${o.cliente?.nome || ""}! Acompanhe o andamento da obra "${o.nome}" (${empresa}) por aqui:\n${url}`;
    const r = await sendMessage(telefone, msg);
    autoEnviado = r.ok && r.id !== "mock";
    if (!r.ok) motivo = r.error;
    else if (r.id === "mock") motivo = "Modo mock (WhatsApp não configurado).";
  }

  return NextResponse.json({ url, autoEnviado, telefone: telefone || null, motivo });
}
