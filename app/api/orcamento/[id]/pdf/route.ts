import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildEndereco(c: {
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
}): string | null {
  const parts = [
    c.logradouro && c.numero ? `${c.logradouro}, ${c.numero}` : c.logradouro ?? null,
    c.complemento,
    c.bairro,
    c.cidade && c.uf ? `${c.cidade}/${c.uf}` : c.cidade ?? null,
    c.cep ? `CEP ${c.cep}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

async function getEmpresa() {
  const rows = await prisma.configuracao.findMany({
    where: { chave: { startsWith: "empresa." } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.chave, r.valor]));
  return {
    nome: map["empresa.nome"],
    cnpj: map["empresa.cnpj"],
    endereco: map["empresa.endereco"],
    telefone: map["empresa.telefone"],
    email: map["empresa.email"],
  };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const orc = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      itens: { include: { servico: true }, orderBy: { id: "asc" } },
    },
  });
  if (!orc) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });

  const empresa = await getEmpresa();

  const [{ renderToBuffer }, { OrcamentoPDF }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/pdf/OrcamentoPDF"),
    import("react"),
  ]);

  const buffer = await renderToBuffer(
    React.createElement(OrcamentoPDF, {
      data: {
        numero: orc.numero,
        criadoEm: orc.criadoEm,
        dataValidade: orc.dataValidade,
        cliente: {
          nome: orc.cliente.nome,
          tipo: orc.cliente.tipo,
          documento: orc.cliente.documento,
          email: orc.cliente.email,
          telefone: orc.cliente.telefone,
          endereco: buildEndereco(orc.cliente),
        },
        itens: orc.itens.map((i) => ({
          servicoNome: i.servico?.nome ?? "—",
          descricao: i.descricao ?? "",
          area: i.area,
          quantidade: i.quantidade,
          unidade: i.unidade,
          custoUnit: i.custoUnit,
          precoUnit: i.precoUnit,
          subtotal: i.subtotal,
        })),
        subtotal: orc.subtotal,
        desconto: orc.desconto,
        total: orc.total,
        condicaoPagamento: orc.condicaoPagamento,
        prazoExecucao: orc.prazoExecucao,
        observacoes: orc.observacoes,
        empresa,
      },
    }) as Parameters<typeof renderToBuffer>[0]
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${orc.numero}.pdf"`,
    },
  });
}
