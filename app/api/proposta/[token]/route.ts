import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerTokenProposta } from "@/lib/proposta/token";

export const dynamic = "force-dynamic";

async function getEmpresa() {
  const rows = await prisma.configuracao.findMany({ where: { chave: { startsWith: "empresa." } } });
  const map = Object.fromEntries(rows.map((r) => [r.chave, r.valor])) as Record<string, string>;
  return {
    nome: map["empresa.nome"] || "Verus Impermeabilização",
    cnpj: map["empresa.cnpj"] || "",
    telefone: map["empresa.telefone"] || map["empresa.whatsapp"] || "",
    email: map["empresa.email"] || "",
    endereco: map["empresa.endereco"] || "",
  };
}

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const id = lerTokenProposta(params.token);
  if (!id) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

  const o = await prisma.orcamento.findUnique({
    where: { id },
    include: {
      cliente: { select: { nome: true, documento: true, cidade: true, uf: true } },
      itens: true,
    },
  });
  if (!o) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });

  const empresa = await getEmpresa();

  return NextResponse.json({
    numero: o.numero,
    status: o.status,
    validade: o.dataValidade,
    aprovadoEm: o.aprovadoEm,
    condicaoPagamento: o.condicaoPagamento,
    prazoExecucao: o.prazoExecucao,
    subtotal: o.subtotal,
    desconto: o.desconto,
    total: o.total,
    cliente: o.cliente,
    itens: o.itens.map((it) => ({
      descricao: it.descricao,
      area: it.area,
      quantidade: it.quantidade,
      unidade: it.unidade,
      precoUnit: it.precoUnit,
      subtotal: it.subtotal,
    })),
    empresa,
  });
}
