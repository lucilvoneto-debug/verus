export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sessaoAtual } from "@/lib/sessao";
import { podeExcluir } from "@/lib/permissions";
import { apagarArquivoPorUrl } from "@/lib/storage";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const a = await prisma.anexo.findUnique({
    where: { id: params.id },
    include: { uploadedBy: { select: { id: true, name: true } } },
  });
  if (!a) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(a);
}

/** PATCH { nome } — renomear. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  const a = await prisma.anexo.update({ where: { id: params.id }, data: { nome } });
  return NextResponse.json(a);
}

/** Quem subiu apaga o próprio; ADMIN/GESTOR apagam qualquer um. */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const a = await prisma.anexo.findUnique({ where: { id: params.id } });
  if (!a) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (a.uploadedById !== sessao.id && !podeExcluir(sessao.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  await prisma.anexo.delete({ where: { id: a.id } });
  await apagarArquivoPorUrl(a.url);
  return NextResponse.json({ ok: true });
}
