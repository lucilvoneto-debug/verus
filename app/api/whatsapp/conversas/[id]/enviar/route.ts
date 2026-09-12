/** POST {texto} → envia pela Cloud API na linha da conversa e grava no histórico. */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarTexto, linhaPadrao } from "@/lib/whatsapp/meta";

const schema = z.object({ texto: z.string().min(1).max(4096) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const conversa = await prisma.conversaWA.findUnique({
    where: { id: params.id },
    include: { linha: true, lead: { select: { id: true } } },
  });
  if (!conversa) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });

  const linha = conversa.linha ?? (await linhaPadrao());
  if (!linha) return NextResponse.json({ error: "Nenhum número WhatsApp conectado. Conecte em Configurações → WhatsApp." }, { status: 400 });

  const r = await enviarTexto(linha.phoneNumberId, conversa.telefone, parsed.data.texto);
  const agora = new Date();
  const msg = await prisma.mensagemWA.create({
    data: {
      conversaId: conversa.id,
      waId: r.waId ?? null,
      texto: parsed.data.texto,
      tipo: "TEXT",
      enviada: true,
      status: r.ok ? "sent" : "failed",
      statusErro: r.ok ? null : r.error ?? "falha",
      userId,
      createdAt: agora,
    },
  });
  await prisma.conversaWA.update({
    where: { id: conversa.id },
    data: { ultimaMensagem: parsed.data.texto.slice(0, 200), ultimaMensagemEm: agora, linhaId: conversa.linhaId ?? linha.id },
  });
  if (conversa.lead?.id) {
    await prisma.leadEvento.create({
      data: { leadId: conversa.lead.id, tipo: "WHATSAPP", descricao: `Equipe: ${parsed.data.texto.slice(0, 300)}`, userId },
    });
  }
  return NextResponse.json({ ok: r.ok, error: r.error, mensagem: msg }, { status: r.ok ? 200 : 502 });
}
