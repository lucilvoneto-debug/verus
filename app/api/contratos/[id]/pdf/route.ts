import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ContratoPDF } from "@/lib/pdf/ContratoPDF";
import React from "react";



function buildEndereco(c: { logradouro?: string|null; numero?: string|null; complemento?: string|null; bairro?: string|null; cidade?: string|null; uf?: string|null; cep?: string|null }): string | null {
  const parts = [
    c.logradouro && c.numero ? `${c.logradouro}, ${c.numero}` : c.logradouro ?? null,
    c.complemento,
    c.bairro,
    c.cidade && c.uf ? `${c.cidade}/${c.uf}` : c.cidade ?? null,
    c.cep ? `CEP ${c.cep}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export const dynamic = "force-dynamic";

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
  const ctr = await prisma.contrato.findUnique({
    where: { id: params.id },
    include: { cliente: true },
  });
  if (!ctr) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });

  const empresa = await getEmpresa();

  const buffer = await renderToBuffer(
    React.createElement(ContratoPDF, {
      data: {
        numero: ctr.numero,
        createdAt: ctr.createdAt,
        cliente: {
          nome: ctr.cliente.nome,
          tipo: ctr.cliente.tipo,
          documento: ctr.cliente.documento,
          endereco: buildEndereco(ctr.cliente),
        },
        valor: ctr.valor,
        condicaoPagamento: ctr.condicaoPagamento,
        prazoExecucao: ctr.prazoExecucao,
        garantiaMeses: ctr.garantiaMeses,
        escopo: ctr.escopo,
        obrigacoesCliente: ctr.obrigacoesCliente,
        obrigacoesEmpresa: ctr.obrigacoesEmpresa,
        clausulasExtras: ctr.clausulasExtras,
        empresa,
      },
    }) as Parameters<typeof renderToBuffer>[0]
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="contrato-${ctr.numero}.pdf"`,
    },
  });
}
