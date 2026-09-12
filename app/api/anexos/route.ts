/**
 * GET  ?entidade=&entidadeId=&q=&tipo=&page=&pageSize=   → lista de anexos
 * POST multipart { file, entidade, entidadeId?, nome? }   → cria anexo
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sessaoAtual } from "@/lib/sessao";
import { salvarArquivo } from "@/lib/storage";
import { entidadeValida, rotularEntidades } from "@/lib/anexos";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const entidade = sp.get("entidade");
  const entidadeId = sp.get("entidadeId");
  const q = sp.get("q")?.trim();
  const tipo = sp.get("tipo"); // "imagem" | "pdf" | "planilha" | "outro"
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(200, Math.max(1, Number(sp.get("pageSize") ?? 50)));

  const where: Prisma.AnexoWhereInput = {};
  if (entidade) where.entidade = entidade;
  if (entidadeId) where.entidadeId = entidadeId;
  if (q) where.nome = { contains: q, mode: "insensitive" };
  if (tipo === "imagem") where.tipo = { startsWith: "image/" };
  else if (tipo === "pdf") where.tipo = "application/pdf";
  else if (tipo === "planilha") where.tipo = { in: ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"] };
  else if (tipo === "outro") where.NOT = [{ tipo: { startsWith: "image/" } }, { tipo: "application/pdf" }];

  const [total, rows] = await Promise.all([
    prisma.anexo.count({ where }),
    prisma.anexo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { uploadedBy: { select: { id: true, name: true } } },
    }),
  ]);
  const rotulos = await rotularEntidades(rows.map((r) => ({ entidade: r.entidade, entidadeId: r.entidadeId })));
  const data = rows.map((r) => ({ ...r, entidadeNome: rotulos[`${r.entidade}:${r.entidadeId}`] ?? null }));

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
}

export async function POST(req: NextRequest) {
  const sessao = await sessaoAtual();
  if (!sessao) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envie multipart/form-data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Campo file ausente" }, { status: 400 });
  const entidade = String(form.get("entidade") ?? "Geral");
  if (!entidadeValida(entidade)) return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
  const entidadeId = String(form.get("entidadeId") ?? "").trim() || "-";
  const nome = String(form.get("nome") ?? "").trim() || file.name;

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const salvo = await salvarArquivo({
      bytes,
      mime: file.type || "application/octet-stream",
      nome: file.name,
      contexto: "anexo",
      userId: sessao.id,
    });
    const anexo = await prisma.anexo.create({
      data: {
        entidade,
        entidadeId,
        nome,
        url: salvo.url,
        tipo: salvo.mime,
        tamanho: salvo.tamanho,
        uploadedById: sessao.id,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });
    return NextResponse.json(anexo, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Falha ao anexar" }, { status: 400 });
  }
}
