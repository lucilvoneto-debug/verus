import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "node:fs";
import path from "node:path";

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
    c.bairro,
    c.cidade && c.uf ? `${c.cidade}/${c.uf}` : c.cidade ?? null,
  ].filter(Boolean);
  return parts.length ? parts.join(" - ") : null;
}

async function getEmpresa() {
  const rows = await prisma.configuracao.findMany({
    where: { chave: { startsWith: "empresa." } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.chave, r.valor]));

  // Carrega logo do filesystem como base64 data URL
  let logoBase64: string | null = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const buf = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    logoBase64 = null;
  }

  return {
    nome: map["empresa.nome"] || "Verus Impermeabilizações",
    cnpj: map["empresa.cnpj"] || "—",
    endereco: map["empresa.endereco"] || "—",
    telefone: map["empresa.telefone"] || "(82) 99166-9449 | (82) 99673-0005",
    email: map["empresa.email"] || "verusimpermeabilizacoes@gmail.com",
    logoBase64,
  };
}

/** Extrai obraNome / responsavel / contatoResponsavel das observações se gravadas como JSON */
function extractMeta(observacoes: string | null) {
  if (!observacoes) return { obraNome: null, responsavel: null, contatoResponsavel: null, notas: null };
  try {
    const parsed = JSON.parse(observacoes);
    if (parsed && typeof parsed === "object") {
      return {
        obraNome: parsed.obra ?? parsed.obraNome ?? null,
        responsavel: parsed.responsavel ?? null,
        contatoResponsavel: parsed.contato ?? parsed.contatoResponsavel ?? null,
        notas: parsed.notas ?? parsed.observacoes ?? null,
      };
    }
  } catch {
    /* observacoes texto livre */
  }
  return { obraNome: null, responsavel: null, contatoResponsavel: null, notas: observacoes };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const orc = await prisma.orcamento.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      itens: { include: { servico: true }, orderBy: { id: "asc" } },
      vendedor: { select: { name: true } },
    },
  });
  if (!orc) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });

  const empresa = await getEmpresa();
  const meta = extractMeta(orc.observacoes);

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
        obraNome: meta.obraNome,
        responsavel: meta.responsavel ?? orc.vendedor?.name ?? null,
        contatoResponsavel: meta.contatoResponsavel,
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
        observacoes: meta.notas,
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
