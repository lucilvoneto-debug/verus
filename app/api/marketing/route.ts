import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dataDoDia } from "@/lib/caixa/validacoes";

export const dynamic = "force-dynamic";

const opt = z.preprocess((v) => (v === "" ? null : v), z.string().nullable().optional());
const conteudo = z.object({
  qual: z.literal("conteudo"),
  titulo: z.string().trim().min(1),
  tipo: z.enum(["POST", "REELS", "STORY", "VIDEO", "GRAVACAO", "OUTRO"]),
  canal: opt,
  data: z.string().min(1),
  status: z.enum(["PLANEJADO", "PRODUCAO", "PUBLICADO", "CANCELADO"]).default("PLANEJADO"),
  responsavel: opt,
  obraId: opt,
  link: opt,
  observacoes: opt,
});
const campanha = z.object({
  qual: z.literal("campanha"),
  nome: z.string().trim().min(1),
  canal: z.string().trim().min(1),
  inicio: z.string().min(1),
  fim: opt,
  verba: z.coerce.number().nonnegative().nullable().optional(),
  gasto: z.coerce.number().nonnegative().nullable().optional(),
  resultado: opt,
  observacoes: opt,
});
const tarefa = z.object({
  qual: z.literal("tarefa"),
  descricao: z.string().trim().min(1),
  responsavel: opt,
  prazo: opt,
  observacoes: opt,
});
const criar = z.discriminatedUnion("qual", [conteudo, campanha, tarefa]);
const mudarStatus = z.object({
  qual: z.enum(["conteudo", "tarefa"]),
  id: z.string().min(1),
  status: z.string().min(1),
});

/** Conteúdos do mês pedido (?mes=AAAA-MM), campanhas, tarefas abertas e números do mês. */
export async function GET(req: NextRequest) {
  const mes = new URL(req.url).searchParams.get("mes") ?? new Date().toISOString().slice(0, 7);
  const [a, m] = mes.split("-").map(Number);
  const ini = new Date(Date.UTC(a, m - 1, 1, 3));
  const fim = new Date(Date.UTC(a, m, 1, 3));
  const [conteudos, campanhas, tarefas] = await Promise.all([
    prisma.conteudoMarketing.findMany({ where: { data: { gte: ini, lt: fim } }, orderBy: { data: "asc" }, include: { obra: { select: { nome: true } } } }),
    prisma.campanhaMarketing.findMany({ orderBy: { inicio: "desc" }, take: 20 }),
    prisma.tarefaMarketing.findMany({ orderBy: [{ status: "asc" }, { prazo: "asc" }], take: 50 }),
  ]);
  const resumo = {
    planejadas: conteudos.filter((c) => c.status !== "CANCELADO").length,
    publicadas: conteudos.filter((c) => c.status === "PUBLICADO").length,
    gravacoes: conteudos.filter((c) => c.tipo === "GRAVACAO").length,
    verbaMes: campanhas.filter((c) => c.inicio < fim && (!c.fim || c.fim >= ini)).reduce((s, c) => s + (c.verba ?? 0), 0),
  };
  return NextResponse.json({ mes, conteudos, campanhas, tarefas, resumo });
}

export async function POST(req: NextRequest) {
  const p = criar.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Dados inválidos", issues: p.error.flatten() }, { status: 400 });
  const d = p.data;
  if (d.qual === "conteudo") {
    const { qual: _q, data, ...resto } = d;
    return NextResponse.json(await prisma.conteudoMarketing.create({ data: { ...resto, data: dataDoDia(data), fonte: "lançado na tela" } }), { status: 201 });
  }
  if (d.qual === "campanha") {
    const { qual: _q, inicio, fim, ...resto } = d;
    return NextResponse.json(
      await prisma.campanhaMarketing.create({ data: { ...resto, inicio: dataDoDia(inicio), fim: fim ? dataDoDia(fim) : null, fonte: "lançado na tela" } }),
      { status: 201 }
    );
  }
  const { qual: _q, prazo, ...resto } = d;
  return NextResponse.json(await prisma.tarefaMarketing.create({ data: { ...resto, prazo: prazo ? dataDoDia(prazo) : null, fonte: "lançado na tela" } }), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const p = mudarStatus.safeParse(await req.json());
  if (!p.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { qual, id, status } = p.data;
  const r =
    qual === "conteudo"
      ? await prisma.conteudoMarketing.update({ where: { id }, data: { status } })
      : await prisma.tarefaMarketing.update({ where: { id }, data: { status } });
  return NextResponse.json(r);
}
