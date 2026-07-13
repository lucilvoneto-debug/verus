import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarTokenProposta } from "@/lib/proposta/token";
import { sendMessage, whatsappStatus } from "@/lib/integrations/whatsapp";

export const dynamic = "force-dynamic";

async function nomeEmpresa() {
  const row = await prisma.configuracao.findFirst({ where: { chave: "empresa.nome" } });
  return row?.valor || "Verus Impermeabilização";
}

/**
 * Gera o link público da proposta, marca ENVIADO e — se o WhatsApp estiver
 * conectado (Evolution/Z-API) e o cliente tiver telefone — manda o link sozinho.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const o = await prisma.orcamento.findUnique({
    where: { id: params.id },
    select: { id: true, numero: true, status: true, cliente: { select: { nome: true, telefone: true } } },
  });
  if (!o) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });

  const token = gerarTokenProposta(o.id);
  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const url = `${origin}/proposta/${token}`;

  if (o.status === "RASCUNHO") {
    await prisma.orcamento.update({ where: { id: o.id }, data: { status: "ENVIADO" } });
  }

  // tenta enviar automático
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
    const msg = `Olá ${o.cliente?.nome || ""}! Segue a proposta da ${empresa} (nº ${o.numero}). Você pode ver e aprovar por aqui:\n${url}`;
    const r = await sendMessage(telefone, msg);
    autoEnviado = r.ok && r.id !== "mock";
    if (!r.ok) motivo = r.error;
    else if (r.id === "mock") motivo = "Modo mock (WhatsApp não configurado).";
  }

  return NextResponse.json({ url, autoEnviado, telefone: telefone || null, motivo });
}
