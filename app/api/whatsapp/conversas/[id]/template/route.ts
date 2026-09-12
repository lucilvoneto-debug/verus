/**
 * POST { nome, idioma, corpo: string[], cabecalho?: string }
 * Envia template aprovado (único jeito de iniciar conversa fora da janela de 24h).
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarTemplate, linhaPadrao, listarTemplates, renderizarTemplate } from "@/lib/whatsapp/meta";

const schema = z.object({
  nome: z.string().min(1),
  idioma: z.string().default("pt_BR"),
  corpo: z.array(z.string()).default([]),
  cabecalho: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const d = parsed.data;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const conversa = await prisma.conversaWA.findUnique({ where: { id: params.id }, include: { linha: true, lead: { select: { id: true } } } });
  if (!conversa) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  const linha = conversa.linha ?? (await linhaPadrao());
  if (!linha) return NextResponse.json({ error: "Nenhum número WhatsApp conectado." }, { status: 400 });

  const componentes: unknown[] = [];
  if (d.cabecalho) componentes.push({ type: "header", parameters: [{ type: "text", text: d.cabecalho }] });
  if (d.corpo.length) componentes.push({ type: "body", parameters: d.corpo.map((t) => ({ type: "text", text: t })) });

  const r = await enviarTemplate(linha.phoneNumberId, conversa.telefone, d.nome, d.idioma, componentes.length ? componentes : undefined);

  // Texto renderizado para o histórico (best-effort: busca o corpo do template).
  let texto = `[template ${d.nome}]`;
  try {
    if (linha.wabaId) {
      const t = (await listarTemplates(linha.wabaId)).find((x) => x.name === d.nome && x.language === d.idioma);
      if (t) texto = renderizarTemplate(t.body, d.corpo);
    }
  } catch {
    /* mantém rótulo */
  }

  const agora = new Date();
  const msg = await prisma.mensagemWA.create({
    data: {
      conversaId: conversa.id,
      waId: r.waId ?? null,
      texto,
      tipo: "TEMPLATE",
      enviada: true,
      status: r.ok ? "sent" : "failed",
      statusErro: r.ok ? null : r.error ?? "falha",
      userId,
      createdAt: agora,
    },
  });
  await prisma.conversaWA.update({
    where: { id: conversa.id },
    data: { ultimaMensagem: texto.slice(0, 200), ultimaMensagemEm: agora, linhaId: conversa.linhaId ?? linha.id },
  });
  if (conversa.lead?.id) {
    await prisma.leadEvento.create({ data: { leadId: conversa.lead.id, tipo: "WHATSAPP", descricao: `Equipe (template ${d.nome}): ${texto.slice(0, 300)}`, userId } });
  }
  return NextResponse.json({ ok: r.ok, error: r.error, mensagem: msg }, { status: r.ok ? 200 : 502 });
}
