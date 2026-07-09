import { NextRequest, NextResponse } from "next/server";
import { parseArquivo } from "@/lib/impermeabilizacao/parse";
import { calcularOrcamento, type AmbienteEntrada } from "@/lib/impermeabilizacao/regras";
import type { UnidadeDesenho } from "@/lib/impermeabilizacao/parse/dxf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Recebe o arquivo do projeto (DXF ou planilha), extrai os ambientes,
 * aplica as regras NBR e devolve a lista calculada + resumo.
 * Não grava nada — é só a leitura pra tela de conferência.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("arquivo");
    const unidade = (form.get("unidade") as string) || undefined;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }
    const blob = file as unknown as File;
    const nome = blob.name || "arquivo";
    const buffer = Buffer.from(await blob.arrayBuffer());

    if (buffer.length === 0) {
      return NextResponse.json({ error: "Arquivo vazio." }, { status: 400 });
    }
    if (buffer.length > 40 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo acima de 40 MB." }, { status: 413 });
    }

    const parsed = parseArquivo(nome, buffer, {
      unidade: unidade as UnidadeDesenho | undefined,
    });

    const resumo = calcularOrcamento(parsed.ambientes as AmbienteEntrada[]);

    return NextResponse.json({
      arquivo: nome,
      formato: parsed.formato,
      detalhe: parsed.detalhe,
      avisos: parsed.avisos,
      resumo,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao ler o arquivo.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
