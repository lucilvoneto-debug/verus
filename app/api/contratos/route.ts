import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contratoSchema } from "@/lib/validations/contrato";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function gerarNumero() {
  const ano = new Date().getFullYear();
  const prefix = `CTR-${ano}-`;
  const ultimos = await prisma.contrato.findMany({
    where: { numero: { startsWith: prefix } },
    select: { numero: true },
    orderBy: { numero: "desc" },
    take: 1,
  });
  const last = ultimos[0]?.numero;
  const next = last ? Number(last.split("-")[2]) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.ContratoWhereInput = {};
  if (status) where.status = status as Prisma.ContratoWhereInput["status"];
  if (q) where.numero = { contains: q };

  const [total, data] = await Promise.all([
    prisma.contrato.count({ where }),
    prisma.contrato.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { cliente: { select: { id: true, nome: true } } },
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contratoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const numero = await gerarNumero();
    const contrato = await prisma.contrato.create({
      data: {
        numero,
        orcamentoId: data.orcamentoId,
        clienteId: data.clienteId,
        valor: data.valor,
        condicaoPagamento: data.condicaoPagamento,
        prazoExecucao: data.prazoExecucao,
        garantiaMeses: data.garantiaMeses,
        escopo: data.escopo,
        obrigacoesCliente: data.obrigacoesCliente || null,
        obrigacoesEmpresa: data.obrigacoesEmpresa || null,
        clausulasExtras: data.clausulasExtras || null,
        status: "PENDENTE",
      },
    });
    return NextResponse.json(contrato, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar contrato";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
