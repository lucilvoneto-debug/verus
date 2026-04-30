import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clienteSchema } from "@/lib/validations/cliente";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      atendimentos: { orderBy: { createdAt: "desc" }, take: 20 },
      orcamentos: { orderBy: { criadoEm: "desc" }, take: 20 },
      obras: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!cliente) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const parsed = clienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const cliente = await prisma.cliente.update({
    where: { id: params.id },
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
  return NextResponse.json(cliente);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.cliente.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
