import type { AmbienteEntrada } from "../regras";
import { parseDxf, type UnidadeDesenho } from "./dxf";
import { parsePlanilha } from "./planilha";

export type FormatoEntrada = "dxf" | "planilha" | "dwg" | "ifc" | "rvt" | "pdf" | "desconhecido";

export interface ResultadoParse {
  ambientes: AmbienteEntrada[];
  formato: FormatoEntrada;
  detalhe: string;
  avisos: string[];
}

export function formatoDoNome(nome: string): FormatoEntrada {
  const ext = nome.toLowerCase().split(".").pop() ?? "";
  if (ext === "dxf") return "dxf";
  if (["xlsx", "xls", "csv", "ods"].includes(ext)) return "planilha";
  if (ext === "dwg") return "dwg";
  if (ext === "ifc") return "ifc";
  if (ext === "rvt") return "rvt";
  if (ext === "pdf") return "pdf";
  return "desconhecido";
}

/**
 * Roteia o arquivo pro parser certo.
 * DXF e planilha são extraídos de verdade. DWG/IFC/PDF ainda precisam de
 * conversão — devolvem erro claro dizendo o que fazer.
 */
export function parseArquivo(
  nomeArquivo: string,
  buffer: Buffer,
  opts?: { unidade?: UnidadeDesenho }
): ResultadoParse {
  const formato = formatoDoNome(nomeArquivo);

  switch (formato) {
    case "dxf": {
      // DXF moderno (R2007+) é UTF-8; se a decodificação UTF-8 tiver muitos
      // caracteres de substituição, cai pra latin1 (DXF ANSI antigo).
      const utf8 = buffer.toString("utf-8");
      const ruins = (utf8.match(/�/g) || []).length;
      const conteudo = ruins > 20 ? buffer.toString("latin1") : utf8;
      const r = parseDxf(conteudo, opts?.unidade);
      return {
        ambientes: r.ambientes,
        formato,
        detalhe: `${r.ambientes.length} ambiente(s) · ${r.poligonosLidos} polígono(s) · unidade ${r.unidadeDetectada}`,
        avisos: r.avisos,
      };
    }
    case "planilha": {
      const r = parsePlanilha(buffer);
      return {
        ambientes: r.ambientes,
        formato,
        detalhe: `${r.linhasLidas} linha(s) · abas: ${r.abas.join(", ")}`,
        avisos: r.avisos,
      };
    }
    case "dwg":
    case "ifc":
      // DWG e IFC são lidos no navegador (WASM), não passam por aqui.
      throw new Error("DWG/IFC são processados no navegador — recarregue a página e tente de novo.");
    case "rvt":
      throw new Error(
        "Revit (.rvt) é formato fechado da Autodesk e não abre direto. No Revit: Arquivo → Exportar → IFC (marque 'exportar ambientes/rooms') e suba o .ifc — sai quase automático."
      );
    case "pdf":
      throw new Error(
        "PDF não tem medida embutida. Preencha as áreas na planilha modelo (ambiente, área, perímetro) e suba a planilha, ou envie o DXF do projeto."
      );
    default:
      throw new Error("Formato não reconhecido. Aceito: DXF (planta CAD) ou planilha (.xlsx/.csv/.ods).");
  }
}
