import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lerTokenProposta } from "@/lib/proposta/token";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getEmpresa() {
  const rows = await prisma.configuracao.findMany({ where: { chave: { startsWith: "empresa." } } });
  const map = Object.fromEntries(rows.map((r) => [r.chave, r.valor])) as Record<string, string>;
  return {
    nome: map["empresa.nome"] || "Verus Impermeabilização",
    cnpj: map["empresa.cnpj"] || "",
    endereco: map["empresa.endereco"] || "",
    telefone: map["empresa.telefone"] || map["empresa.whatsapp"] || "",
    email: map["empresa.email"] || "",
  };
}

function buildEndereco(c: any): string | null {
  const parts = [
    c.logradouro && c.numero ? `${c.logradouro}, ${c.numero}` : c.logradouro ?? null,
    c.bairro,
    c.cidade && c.uf ? `${c.cidade}/${c.uf}` : c.cidade ?? null,
  ].filter(Boolean);
  return parts.length ? parts.join(" - ") : null;
}

/** Remove os carimbos internos de aceite (IP/data) das observações. */
function limparObs(obs: string | null): string | null {
  if (!obs) return null;
  const t = obs
    .split("\n")
    .filter((l) => !/^\s*\[(APROVADO|RECUSADO) via link/.test(l))
    .join("\n")
    .trim();
  return t || null;
}

/** PDF público da proposta (construtora baixa pelo link, sem login). */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const id = lerTokenProposta(params.token);
  if (!id) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

  const orc = await prisma.orcamento.findUnique({
    where: { id },
    include: {
      cliente: true,
      itens: { include: { servico: true }, orderBy: { id: "asc" } },
      vendedor: { select: { name: true } },
    },
  });
  if (!orc) return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });

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
        obraNome: null,
        responsavel: orc.vendedor?.name ?? null,
        contatoResponsavel: null,
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
        observacoes: limparObs(orc.observacoes),
        empresa,
      },
    }) as Parameters<typeof renderToBuffer>[0]
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="proposta-${orc.numero}.pdf"`,
    },
  });
}
