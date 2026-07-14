import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getEmpresa() {
  const rows = await prisma.configuracao.findMany({ where: { chave: { startsWith: "empresa." } } });
  const m = Object.fromEntries(rows.map((r) => [r.chave, r.valor])) as Record<string, string>;
  return {
    nome: m["empresa.nome"] || "Verus Impermeabilização",
    cnpj: m["empresa.cnpj"] || "",
    telefone: m["empresa.telefone"] || m["empresa.whatsapp"] || "",
    endereco: m["empresa.endereco"] || "",
  };
}

/** Gera o Termo de Garantia (PDF) da obra. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const obra = await prisma.obra.findUnique({
    where: { id: params.id },
    include: { cliente: { select: { nome: true } }, contrato: { select: { garantiaMeses: true } } },
  });
  if (!obra) return NextResponse.json({ error: "Obra não encontrada." }, { status: 404 });

  const empresa = await getEmpresa();
  const [{ renderToBuffer }, { GarantiaPDF }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/lib/pdf/GarantiaPDF"),
    import("react"),
  ]);

  const buffer = await renderToBuffer(
    React.createElement(GarantiaPDF, {
      d: {
        empresa,
        clienteNome: obra.cliente?.nome ?? "—",
        obraNome: obra.nome,
        obraEndereco: obra.endereco,
        numero: obra.numero,
        dataConclusao: (obra.dataConclusao ?? new Date()).toLocaleDateString("pt-BR"),
        garantiaMeses: obra.contrato?.garantiaMeses ?? 60,
      },
    }) as Parameters<typeof renderToBuffer>[0]
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="garantia-${obra.numero}.pdf"`,
    },
  });
}
