import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fornecedorSchema } from "@/lib/validations/fornecedor";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const fornecedor = await prisma.fornecedor.findUnique({
    where: { id: params.id },
    include: {
      pedidos: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          numero: true,
          dataPedido: true,
          dataPrevista: true,
          status: true,
          total: true,
        },
      },
    },
  });
  if (!fornecedor) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(fornecedor);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = fornecedorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const fornecedor = await prisma.fornecedor.update({
    where: { id: params.id },
    data: {
      nome: data.nome,
      cnpj: data.cnpj.replace(/\D/g, ""),
      contato: data.contato || null,
      email: data.email || null,
      telefone: data.telefone || null,
      endereco: data.endereco || null,
      observacoes: data.observacoes || null,
      ativo: data.ativo,
    },
  });
  return NextResponse.json(fornecedor);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.fornecedor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
