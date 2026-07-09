/**
 * Parser DWG — roda no NAVEGADOR (libredwg WASM).
 * Lê o DWG binário, pega as polilinhas fechadas + textos e reusa o mesmo
 * núcleo de geometria do DXF (piso + perímetro + nome pelo texto interno).
 */
import {
  ambientesDeGeometria,
  type PoligonoGeo,
  type TextoGeo,
  type UnidadeDesenho,
  type ResultadoGeo,
} from "./geometria";

let libredwgSingleton: any = null;

/** Extrai entidades relevantes de um objeto de entidades do DwgDatabase. */
function coletar(entidades: any[], poligonos: PoligonoGeo[], textos: TextoGeo[]) {
  for (const ent of entidades ?? []) {
    const type = (ent?.type || ent?.entityType || "").toString().toUpperCase();
    if (type.includes("POLYLINE")) {
      const verts = (ent.vertices ?? ent.points ?? []).map((v: any) => ({ x: v.x ?? v[0] ?? 0, y: v.y ?? v[1] ?? 0 }));
      const fechada = ent.closed || ent.shape || (ent.flags & 1) === 1 || verts.length >= 3;
      if (verts.length >= 3 && fechada) poligonos.push({ pts: verts, layer: ent.layer ?? "0" });
    } else if (type === "TEXT" || type === "MTEXT") {
      const t = (ent.text ?? ent.textValue ?? "").toString().replace(/\\[A-Za-z0-9.|]+;?/g, "").trim();
      const pos = ent.startPoint ?? ent.position ?? ent.insertionPoint ?? { x: ent.x, y: ent.y };
      if (t && pos && pos.x != null && pos.y != null) textos.push({ x: pos.x, y: pos.y, texto: t });
    }
  }
}

export async function parseDwgClient(bytes: Uint8Array, unidade?: UnidadeDesenho): Promise<ResultadoGeo> {
  const mod = await import("@mlightcad/libredwg-web");
  const { LibreDwg, Dwg_File_Type } = mod as any;

  if (!libredwgSingleton) {
    libredwgSingleton = await LibreDwg.create("/wasm/");
  }
  const libredwg = libredwgSingleton;

  let db: any;
  let dwg: any;
  try {
    dwg = libredwg.dwg_read_data(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), Dwg_File_Type.DWG);
    db = libredwg.convert(dwg);
  } catch (e) {
    throw new Error("Não consegui ler o DWG. Salve como DXF no AutoCAD e suba o DXF. (" + (e instanceof Error ? e.message : "") + ")");
  }

  const poligonos: PoligonoGeo[] = [];
  const textos: TextoGeo[] = [];

  // o DwgDatabase pode expor entidades em .entities e/ou dentro de blocos
  if (Array.isArray(db?.entities)) coletar(db.entities, poligonos, textos);
  const blocks = db?.blocks ?? db?.tables?.BLOCK_RECORD?.entries ?? [];
  if (Array.isArray(blocks)) {
    for (const b of blocks) coletar(b?.entities ?? [], poligonos, textos);
  }

  try { libredwg.dwg_free(dwg); } catch { /* ignore */ }

  return ambientesDeGeometria(poligonos, textos, "DWG", unidade);
}
