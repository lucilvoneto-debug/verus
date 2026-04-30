import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clienteSchema } from "@/lib/validations/cliente";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const tipo = searchParams.get("tipo");
  const categoria = searchParams.get("categoria");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 10)));

  const where: Prisma.ClienteWhereInput = {};
  if (q) {
    where.OR = [
      { nome: { contains: q } },
      { documento: { contains: q } },
      { email: { contains: q } },
    ];
  }
  if (tipo === "PF" || tipo === "PJ") where.tipo = tipo;
  if (categoria) where.categoria = categoria as Prisma.ClienteWhereInput["categoria"];

  const [total, data] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, tipo: true, nome: true, documento: true, email: true,
        telefone: true, cidade: true, uf: true, categoria: true, createdAt: true,
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = clienteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const cliente = await prisma.cliente.create({
      data: {
        tipo: data.tipo,
        nome: data.nome,
        documento: data.documento.replace(/\D/g, ""),
        email: data.email || null,
        telefone: data.telefone || null,
        whatsapp: data.whatsapp || null,
        cep: data.cep || null,
        logradouro: data.logradouro || null,
        numero: data.numero || null,
        complemento: data.complemento || null,
        bairro: data.bairro || null,
        cidade: data.cidade || null,
        uf: data.uf || null,
        categoria: data.categoria,
        observacoes: data.observacoes || null,
      },
    });
    return NextResponse.json(cliente, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar cliente";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
