import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { CertificadoGarantiaPDF } from "@/lib/pdf/CertificadoGarantiaPDF";
import React from "react";

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
  const g = await prisma.garantia.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      obra: true,
    },
  });
  if (!g) return NextResponse.json({ error: "Garantia não encontrada" }, { status: 404 });

  const empresa = await getEmpresa();

  const buffer = await renderToBuffer(
    React.createElement(CertificadoGarantiaPDF, {
      data: {
        cliente: { nome: g.cliente.nome },
        obra: {
          numero: g.obra.numero,
          nome: g.obra.nome,
          endereco: g.obra.endereco,
        },
        dataInicio: g.dataInicio,
        dataFim: g.dataFim,
        prazoMeses: g.prazoMeses,
        tipoGarantia: g.tipoGarantia,
        condicoes: g.condicoes,
        empresa,
      },
    }) as Parameters<typeof renderToBuffer>[0]
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-garantia-${g.obra.numero}.pdf"`,
    },
  });
}
