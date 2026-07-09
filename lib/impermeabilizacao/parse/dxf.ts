import DxfParser from "dxf-parser";
import type { AmbienteEntrada } from "../regras";
import {
  ambientesDeGeometria,
  type PoligonoGeo,
  type TextoGeo,
  type UnidadeDesenho,
} from "./geometria";

export type { UnidadeDesenho } from "./geometria";

export interface ResultadoDxf {
  ambientes: AmbienteEntrada[];
  unidadeDetectada: UnidadeDesenho;
  poligonosLidos: number;
  avisos: string[];
}

/** Extrai polígonos + textos de um DXF (texto). */
export function entidadesDxf(conteudo: string): { poligonos: PoligonoGeo[]; textos: TextoGeo[] } {
  const parser = new DxfParser();
  let dxf: any;
  try {
    dxf = parser.parseSync(conteudo);
  } catch (e) {
    throw new Error("Arquivo DXF inválido ou corrompido: " + (e instanceof Error ? e.message : ""));
  }
  const entidades: any[] = dxf?.entities ?? [];
  const poligonos: PoligonoGeo[] = [];
  const textos: TextoGeo[] = [];

  for (const ent of entidades) {
    const type = ent.type;
    if (type === "LWPOLYLINE" || type === "POLYLINE") {
      const verts = (ent.vertices ?? []).map((v: any) => ({ x: v.x ?? 0, y: v.y ?? 0 }));
      const fechada = ent.shape || (ent.flags & 1) === 1 || verts.length >= 3;
      if (verts.length >= 3 && fechada) poligonos.push({ pts: verts, layer: ent.layer ?? "0" });
    } else if (type === "TEXT" || type === "MTEXT") {
      const t = (ent.text ?? "").toString().replace(/\\[A-Za-z0-9.|]+;?/g, "").trim();
      const pos = ent.startPoint ?? ent.position ?? { x: ent.x, y: ent.y };
      if (t && pos && pos.x != null && pos.y != null) textos.push({ x: pos.x, y: pos.y, texto: t });
    }
  }
  return { poligonos, textos };
}

export function parseDxf(conteudo: string, unidade?: UnidadeDesenho): ResultadoDxf {
  const { poligonos, textos } = entidadesDxf(conteudo);
  const r = ambientesDeGeometria(poligonos, textos, "DXF", unidade);
  return {
    ambientes: r.ambientes,
    unidadeDetectada: r.unidadeDetectada,
    poligonosLidos: r.poligonosLidos,
    avisos: r.avisos,
  };
}
