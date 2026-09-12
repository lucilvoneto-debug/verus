/**
 * POST → envia pela Cloud API na linha da conversa e grava no histórico.
 *   JSON      { texto }
 *   multipart { file, legenda? }   imagem/documento/vídeo/áudio (até 15 MB)
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarMidia, enviarTexto, linhaPadrao, subirMidia, tipoMidiaDoMime } from "@/lib/whatsapp/meta";
import { MAX_BYTES } from "@/lib/storage";

const schema = z.object({ texto: z.string().min(1).max(4096) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) return enviarArquivo(req, params.id);

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

async function enviarArquivo(req: NextRequest, conversaId: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) return NextResponse.json({ error: "Campo file ausente" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Arquivo acima de 15 MB" }, { status: 413 });
  const legenda = String(form.get("legenda") ?? "").trim();

  const conversa = await prisma.conversaWA.findUnique({
    where: { id: conversaId },
    include: { linha: true, lead: { select: { id: true } } },
  });
  if (!conversa) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
  const linha = conversa.linha ?? (await linhaPadrao());
  if (!linha) return NextResponse.json({ error: "Nenhum número WhatsApp conectado." }, { status: 400 });

  const mime = file.type || "application/octet-stream";
  const tipo = tipoMidiaDoMime(mime);
  const bytes = Buffer.from(await file.arrayBuffer());
  const up = await subirMidia(linha.phoneNumberId, bytes, mime, file.name);
  if (!up.ok || !up.mediaId) return NextResponse.json({ error: up.error ?? "Falha ao subir mídia" }, { status: 502 });

  const r = await enviarMidia(linha.phoneNumberId, conversa.telefone, { mediaId: up.mediaId, tipo, legenda, nomeArquivo: file.name });
  const agora = new Date();
  const rotulo = legenda || (tipo === "image" ? "[imagem]" : tipo === "video" ? "[vídeo]" : tipo === "audio" ? "[áudio]" : file.name);
  const msg = await prisma.mensagemWA.create({
    data: {
      conversaId: conversa.id,
      waId: r.waId ?? null,
      texto: rotulo,
      tipo: tipo.toUpperCase(),
      enviada: true,
      status: r.ok ? "sent" : "failed",
      statusErro: r.ok ? null : r.error ?? "falha",
      mediaId: up.mediaId,
      mediaMime: mime,
      mediaNome: file.name,
      userId,
      createdAt: agora,
    },
  });
  await prisma.conversaWA.update({
    where: { id: conversa.id },
    data: { ultimaMensagem: rotulo.slice(0, 200), ultimaMensagemEm: agora, linhaId: conversa.linhaId ?? linha.id },
  });
  if (conversa.lead?.id) {
    await prisma.leadEvento.create({ data: { leadId: conversa.lead.id, tipo: "WHATSAPP", descricao: `Equipe: ${rotulo.slice(0, 300)}`, userId } });
  }
  return NextResponse.json({ ok: r.ok, error: r.error, mensagem: msg }, { status: r.ok ? 200 : 502 });
}
