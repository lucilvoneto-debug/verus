import { NextRequest, NextResponse } from "next/server";
import { calcularOrcamento, type AmbienteEntrada } from "@/lib/impermeabilizacao/regras";
import { gerarMemorialPdf } from "@/lib/impermeabilizacao/memorialPdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Gera o PDF do memorial de quantitativo a partir da lista de ambientes já editada.
 * Recebe { arquivo, ambientes: AmbienteEntrada[], preco?, cliente? }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ambientes = (body.ambientes ?? []) as AmbienteEntrada[];
    if (!Array.isArray(ambientes) || ambientes.length === 0) {
      return NextResponse.json({ error: "Sem ambientes para gerar o memorial." }, { status: 400 });
    }

    const resumo = calcularOrcamento(ambientes);
    const data = new Date().toLocaleDateString("pt-BR");

    const pdf = await gerarMemorialPdf({
      arquivo: (body.arquivo || "projeto").toString(),
      cliente: body.cliente ? body.cliente.toString() : undefined,
      preco: typeof body.preco === "number" ? body.preco : undefined,
      data,
      resumo,
    });

    return new NextResponse(pdf as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="memorial_${(body.arquivo || "orcamento").toString().replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao gerar o PDF.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
