import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pedidoCompraSchema } from "@/lib/validations/pedidoCompra";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

async function nextNumero() {
  const ano = new Date().getFullYear();
  const prefix = `PC-${ano}-`;
  const last = await prisma.pedidoCompra.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const seq = last ? Number(last.numero.split("-")[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const fornecedorId = searchParams.get("fornecedorId");
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 20)));

  const where: Prisma.PedidoCompraWhereInput = {};
  if (status === "RASCUNHO" || status === "ENVIADO" || status === "RECEBIDO" || status === "CANCELADO") {
    where.status = status;
  }
  if (fornecedorId) where.fornecedorId = fornecedorId;
  if (q) where.numero = { contains: q };

  const [total, data] = await Promise.all([
    prisma.pedidoCompra.count({ where }),
    prisma.pedidoCompra.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { fornecedor: { select: { id: true, nome: true } } },
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
    const parsed = pedidoCompraSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const total = data.itens.reduce((s, i) => s + i.subtotal, 0);
    const numero = await nextNumero();

    const pedido = await prisma.pedidoCompra.create({
      data: {
        numero,
        fornecedorId: data.fornecedorId,
        dataPedido: new Date(data.dataPedido),
        dataPrevista: new Date(data.dataPrevista),
        observacoes: data.observacoes || null,
        total,
        itens: {
          create: data.itens.map((i) => ({
            materialId: i.materialId,
            quantidade: i.quantidade,
            custoUnit: i.custoUnit,
            subtotal: i.subtotal,
          })),
        },
      },
      include: { itens: true, fornecedor: { select: { id: true, nome: true } } },
    });
    return NextResponse.json(pedido, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar pedido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
