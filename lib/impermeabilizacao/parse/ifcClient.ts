/**
 * Parser IFC (BIM) — roda no NAVEGADOR (web-ifc WASM).
 * Extrai cada IfcSpace com nome + área de piso + perímetro (das BaseQuantities)
 * e monta a lista de ambientes já classificada. Melhor caso: quase 100% automático.
 *
 * Reaproveita a abordagem do app engenharia-os (mesmo web-ifc, wasm em /wasm/).
 */
import type { AmbienteEntrada } from "../regras";
import { classificarNome } from "../classificar";

export interface ResultadoIfc {
  ambientes: AmbienteEntrada[];
  software?: string;
  schema?: string;
  espacosLidos: number;
  avisos: string[];
}

function texto(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "object" && v !== null && "value" in (v as any)) return String((v as any).value);
  return String(v);
}
function num(v: unknown): number | undefined {
  if (v == null) return undefined;
  const raw = typeof v === "object" && v !== null && "value" in (v as any) ? (v as any).value : v;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function detectaSoftware(header: string): string | undefined {
  const h = header.toUpperCase();
  if (h.includes("REVIT") || h.includes("AUTODESK")) return "Revit";
  if (h.includes("ARCHICAD") || h.includes("GRAPHISOFT")) return "ArchiCAD";
  if (h.includes("TQS")) return "TQS";
  if (h.includes("EBERICK") || h.includes("ALTOQI")) return "Eberick";
  if (h.includes("SKETCHUP")) return "SketchUp";
  return undefined;
}

type Qto = { area?: number; perimetro?: number };

/** Índice expressID -> {área, perímetro} a partir das IfcElementQuantity. */
function indexarQuantidades(api: any, modelID: number, IFCRELDEFINESBYPROPERTIES: number): Map<number, Qto> {
  const idx = new Map<number, Qto>();
  const relIDs = api.GetLineIDsWithType(modelID, IFCRELDEFINESBYPROPERTIES);
  for (let i = 0; i < relIDs.size(); i++) {
    try {
      const rel = api.GetLine(modelID, relIDs.get(i));
      const def = rel?.RelatingPropertyDefinition;
      if (!def) continue;
      const defLine = api.GetLine(modelID, def.value ?? def);
      const quantities = defLine?.Quantities;
      if (!Array.isArray(quantities)) continue;

      const qto: Qto = {};
      for (const q of quantities) {
        const qLine = api.GetLine(modelID, q.value ?? q);
        const nome = (texto(qLine?.Name) || "").toLowerCase();
        const areaVal = num(qLine?.AreaValue);
        const lenVal = num(qLine?.LengthValue);
        if (areaVal != null && (nome.includes("area") || nome.includes("área"))) {
          // prioriza Net(Floor)Area; senão pega a primeira
          if (nome.includes("net") || qto.area == null) qto.area = areaVal;
        }
        if (lenVal != null && (nome.includes("perimeter") || nome.includes("perímetro") || nome.includes("perimetro"))) {
          if (qto.perimetro == null) qto.perimetro = lenVal;
        }
      }
      if (qto.area == null && qto.perimetro == null) continue;

      const related = rel?.RelatedObjects;
      if (Array.isArray(related)) {
        for (const obj of related) {
          const oid = obj.value ?? obj;
          if (typeof oid === "number") idx.set(oid, qto);
        }
      }
    } catch {
      /* Qto malformado — ignora */
    }
  }
  return idx;
}

let apiSingleton: any = null;

export async function parseIfcClient(bytes: Uint8Array): Promise<ResultadoIfc> {
  const web = await import("web-ifc");
  const { IfcAPI, IFCSPACE, IFCRELDEFINESBYPROPERTIES } = web as any;

  if (!apiSingleton) {
    const api = new IfcAPI();
    api.SetWasmPath("/wasm/", true); // true = caminho absoluto (public/), senão resolve do chunk JS
    await api.Init();
    apiSingleton = api;
  }
  const api = apiSingleton;

  const avisos: string[] = [];
  const modelID = api.OpenModel(bytes, { COORDINATE_TO_ORIGIN: true });

  let schema: string | undefined;
  try { schema = api.GetModelSchema(modelID); } catch { /* ignore */ }
  const software = detectaSoftware(new TextDecoder().decode(bytes.slice(0, 2000)));

  const qtoIndex = indexarQuantidades(api, modelID, IFCRELDEFINESBYPROPERTIES);

  const ambientes: AmbienteEntrada[] = [];
  let semArea = 0;
  const spaceIDs = api.GetLineIDsWithType(modelID, IFCSPACE);
  for (let i = 0; i < spaceIDs.size(); i++) {
    const id = spaceIDs.get(i);
    const line = api.GetLine(modelID, id);
    const nome = texto(line.LongName) || texto(line.Name) || `Ambiente ${id}`;
    const qto = qtoIndex.get(id) ?? {};
    const areaPiso = qto.area ?? 0;
    if (areaPiso <= 0) semArea++;
    ambientes.push({
      nome,
      areaPiso: Math.round(areaPiso * 100) / 100,
      perimetro: qto.perimetro ? Math.round(qto.perimetro * 100) / 100 : 0,
      tipo: classificarNome(nome),
      origem: "IFC",
    });
  }

  api.CloseModel(modelID);

  if (ambientes.length === 0) {
    throw new Error("IFC sem ambientes (IfcSpace). No Revit, defina Ambientes/Rooms antes de exportar e marque 'Export rooms/spaces' no IFC.");
  }
  if (semArea > 0) avisos.push(`${semArea} ambiente(s) sem área nas quantidades do IFC — confira/preencha na tabela.`);
  const semPerim = ambientes.filter((a) => !a.perimetro).length;
  if (semPerim > 0) avisos.push(`${semPerim} ambiente(s) sem perímetro no IFC — informe pra calcular o rodapé.`);

  return { ambientes, software, schema, espacosLidos: ambientes.length, avisos };
}
