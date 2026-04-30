import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { medicaoSchema } from "@/lib/validations/medicao";
import { z } from "zod";

export const dynamic = "force-dynamic";

const acaoSchema = z.object({
  acao: z.enum(["APROVAR", "FATURAR"]),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const m = await prisma.medicao.findUnique({
    where: { id: params.id },
    include: {
      obra: {
        select: {
          id: true,
          numero: true,
          nome: true,
          clienteId: true,
          contratoId: true,
          cliente: { select: { id: true, nome: true } },
        },
      },
    },
  });
  if (!m) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(m);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  // ação: aprovar/faturar
  if (body && typeof body === "object" && "acao" in body) {
    const parsed = acaoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ação inválida", issues: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const medicao = await prisma.medicao.findUnique({
      where: { id: params.id },
      include: { obra: { select: { id: true, nome: true, clienteId: true, contratoId: true } } },
    });
    if (!medicao) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    if (parsed.data.acao === "APROVAR") {
      const updated = await prisma.medicao.update({
        where: { id: params.id },
        data: { status: "APROVADA" },
      });
      return NextResponse.json(updated);
    }

    // FATURAR: transação — atualiza medição + cria ContaReceber
    if (medicao.status === "FATURADA") {
      return NextResponse.json({ error: "Medição já faturada" }, { status: 400 });
    }
    const venc = new Date();
    venc.setDate(venc.getDate() + 30);

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.medicao.update({
        where: { id: params.id },
        data: { status: "FATURADA", faturadoEm: new Date() },
      });
      const conta = await tx.contaReceber.create({
        data: {
          clienteId: medicao.obra.clienteId,
          contratoId: medicao.obra.contratoId,
          obraId: medicao.obra.id,
          descricao: `Medição ${medicao.numero} - ${medicao.obra.nome}`,
          valor: medicao.valor,
          vencimento: venc,
          status: "ABERTA",
        },
      });
      return { medicao: updated, contaReceber: conta };
    });
    return NextResponse.json(result);
  }

  const parsed = medicaoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const medicao = await prisma.medicao.update({
    where: { id: params.id },
    data: {
      dataReferencia: new Date(data.dataReferencia),
      percentualExecutado: data.percentualExecutado,
      valor: data.valor,
      observacoes: data.observacoes || null,
    },
  });
  return NextResponse.json(medicao);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.medicao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
