/** POST { para? } → manda o link público de acompanhamento da obra por e-mail. */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarTokenObra } from "@/lib/proposta/token";
import { emailStatus, enviarEmail, layoutEmail } from "@/lib/integrations/email";
import { EMPRESA } from "@/lib/site/empresa";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const o = await prisma.obra.findUnique({
    where: { id: params.id },
    select: { id: true, numero: true, nome: true, cliente: { select: { nome: true, email: true } } },
  });
  if (!o) return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });

  const para = String(body.para ?? o.cliente.email ?? "").trim();
  if (!para) return NextResponse.json({ error: "Cliente sem e-mail cadastrado. Informe um endereço." }, { status: 400 });

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const url = `${origin}/obra/${gerarTokenObra(o.id)}`;

  const html = layoutEmail({
    titulo: `Acompanhe sua obra ${o.numero}`,
    corpoHtml: `<p>Olá, ${o.cliente.nome}!</p>
      <p>Você pode acompanhar o andamento da obra <strong>${o.nome}</strong> em tempo real: etapas, diário com fotos e previsão de término.</p>
      <p>Dúvidas? Chame no WhatsApp ${EMPRESA.telefoneFormatado}.</p>`,
    botao: { texto: "Acompanhar obra", url },
  });

  const r = await enviarEmail({ para, assunto: `Acompanhamento da obra ${o.numero} — ${EMPRESA.nome}`, html, texto: url });
  if (!r.ok) return NextResponse.json({ error: r.error ?? "Falha no envio" }, { status: 502 });
  return NextResponse.json({ ok: true, url, para, mock: r.mock ?? false, status: emailStatus() });
}
