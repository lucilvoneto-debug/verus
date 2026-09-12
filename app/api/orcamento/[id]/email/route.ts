/** POST { para? } → manda o link público da proposta por e-mail (Resend). */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarTokenProposta } from "@/lib/proposta/token";
import { emailStatus, enviarEmail, layoutEmail } from "@/lib/integrations/email";
import { EMPRESA } from "@/lib/site/empresa";
import { formatCurrency } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const o = await prisma.orcamento.findUnique({
    where: { id: params.id },
    select: { id: true, numero: true, status: true, total: true, dataValidade: true, cliente: { select: { nome: true, email: true } }, vendedor: { select: { name: true } } },
  });
  if (!o) return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });

  const para = String(body.para ?? o.cliente.email ?? "").trim();
  if (!para) return NextResponse.json({ error: "Cliente sem e-mail cadastrado. Informe um endereço." }, { status: 400 });

  const origin = req.headers.get("origin") || new URL(req.url).origin;
  const url = `${origin}/proposta/${gerarTokenProposta(o.id)}`;
  const validade = new Intl.DateTimeFormat("pt-BR").format(o.dataValidade);

  const html = layoutEmail({
    titulo: `Proposta nº ${o.numero}`,
    corpoHtml: `<p>Olá, ${o.cliente.nome}!</p>
      <p>Segue a proposta de impermeabilização da ${EMPRESA.nome} no valor de <strong>${formatCurrency(o.total)}</strong>, válida até <strong>${validade}</strong>.</p>
      <p>Pelo link você vê o escopo completo, baixa o PDF e aprova digitalmente.</p>
      <p>Qualquer dúvida, responda este e-mail ou chame no WhatsApp ${EMPRESA.telefoneFormatado}.</p>
      <p>— ${o.vendedor.name}, ${EMPRESA.nome}</p>`,
    botao: { texto: "Ver e aprovar proposta", url },
  });

  const r = await enviarEmail({ para, assunto: `Proposta ${o.numero} — ${EMPRESA.nome}`, html, texto: `Proposta ${o.numero}: ${url}` });
  if (!r.ok) return NextResponse.json({ error: r.error ?? "Falha no envio" }, { status: 502 });

  if (o.status === "RASCUNHO") await prisma.orcamento.update({ where: { id: o.id }, data: { status: "ENVIADO" } });

  return NextResponse.json({ ok: true, url, para, mock: r.mock ?? false, status: emailStatus() });
}
