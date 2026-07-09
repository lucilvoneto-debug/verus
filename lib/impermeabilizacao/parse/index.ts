import type { AmbienteEntrada } from "../regras";
import { parseDxf, type UnidadeDesenho } from "./dxf";
import { parsePlanilha } from "./planilha";

export type FormatoEntrada = "dxf" | "planilha" | "dwg" | "ifc" | "pdf" | "desconhecido";

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
      const r = parseDxf(buffer.toString("latin1"), opts?.unidade);
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
      throw new Error(
        "DWG não é lido direto no servidor. No AutoCAD: SALVAR COMO → 'AutoCAD DXF (*.dxf)' e suba o DXF. (Os ambientes precisam ser polilinhas fechadas.)"
      );
    case "ifc":
      throw new Error(
        "IFC (BIM) ainda não é lido aqui. Exporte a lista de ambientes (IfcSpace: nome + área) para planilha, ou salve a planta em DXF."
      );
    case "pdf":
      throw new Error(
        "PDF não tem medida embutida. Preencha as áreas na planilha modelo (ambiente, área, perímetro) e suba a planilha, ou envie o DXF do projeto."
      );
    default:
      throw new Error("Formato não reconhecido. Aceito: DXF (planta CAD) ou planilha (.xlsx/.csv/.ods).");
  }
}
