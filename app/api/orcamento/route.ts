import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { orcamentoSchema } from "@/lib/validations/orcamento";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const vendedorId = searchParams.get("vendedorId");
  const dataIni = searchParams.get("dataIni");
  const dataFim = searchParams.get("dataFim");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.OrcamentoWhereInput = {};
  if (status) where.status = status as Prisma.OrcamentoWhereInput["status"];
  if (vendedorId) where.vendedorId = vendedorId;
  if (q) where.numero = { contains: q };
  if (dataIni || dataFim) {
    where.criadoEm = {};
    if (dataIni) (where.criadoEm as Prisma.DateTimeFilter).gte = new Date(dataIni);
    if (dataFim) (where.criadoEm as Prisma.DateTimeFilter).lte = new Date(dataFim);
  }

  const [total, data] = await Promise.all([
    prisma.orcamento.count({ where }),
    prisma.orcamento.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cliente: { select: { id: true, nome: true } },
        vendedor: { select: { id: true, name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

async function gerarNumero() {
  const ano = new Date().getFullYear();
  const prefix = `ORC-${ano}-`;
  const ultimos = await prisma.orcamento.findMany({
    where: { numero: { startsWith: prefix } },
    select: { numero: true },
    orderBy: { numero: "desc" },
    take: 1,
  });
  const last = ultimos[0]?.numero;
  const next = last ? Number(last.split("-")[2]) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = orcamentoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // calcula totais no servidor
    const itensCalc = data.itens.map((it) => {
      const subtotal = +(it.quantidade * it.precoUnit).toFixed(2);
      return { ...it, subtotal };
    });
    const subtotal = +itensCalc.reduce((s, it) => s + it.subtotal, 0).toFixed(2);
    const desconto = +data.desconto.toFixed(2);
    const total = +Math.max(0, subtotal - desconto).toFixed(2);
    const custoEstimado = +itensCalc
      .reduce((s, it) => s + it.quantidade * it.custoUnit, 0)
      .toFixed(2);
    const margemPrevista = total > 0 ? +(((total - custoEstimado) / total) * 100).toFixed(2) : 0;

    const numero = await gerarNumero();

    const orcamento = await prisma.$transaction(async (tx) => {
      return tx.orcamento.create({
        data: {
          numero,
          clienteId: data.clienteId,
          visitaId: data.visitaId || null,
          vendedorId: data.vendedorId,
          dataValidade: new Date(data.dataValidade),
          status: data.status,
          subtotal,
          desconto,
          total,
          custoEstimado,
          margemPrevista,
          condicaoPagamento: data.condicaoPagamento || null,
          prazoExecucao: data.prazoExecucao || null,
          observacoes: data.observacoes || null,
          itens: {
            create: itensCalc.map((it) => ({
              servicoId: it.servicoId,
              descricao: it.descricao,
              area: it.area ?? null,
              quantidade: it.quantidade,
              unidade: it.unidade,
              custoUnit: it.custoUnit,
              precoUnit: it.precoUnit,
              subtotal: it.subtotal,
            })),
          },
        },
        include: { itens: true },
      });
    });

    return NextResponse.json(orcamento, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar orçamento";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
