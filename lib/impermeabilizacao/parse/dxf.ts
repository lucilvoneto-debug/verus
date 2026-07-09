import DxfParser from "dxf-parser";
import type { AmbienteEntrada } from "../regras";
import { classificarNome } from "../classificar";

export type UnidadeDesenho = "m" | "cm" | "mm";

interface Ponto {
  x: number;
  y: number;
}

interface Poligono {
  pts: Ponto[];
  layer: string;
}

interface Texto {
  x: number;
  y: number;
  texto: string;
}

const FATOR: Record<UnidadeDesenho, number> = { m: 1, cm: 0.01, mm: 0.001 };

/** Área por fórmula do polígono (shoelace), sempre positiva. */
function areaPoligono(pts: Ponto[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(a) / 2;
}

function perimetroPoligono(pts: Ponto[]): number {
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    p += Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y);
  }
  return p;
}

/** Ponto dentro do polígono (ray casting). */
function dentro(pt: Ponto, poly: Ponto[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function centro(pts: Ponto[]): Ponto {
  const s = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
}

export interface ResultadoDxf {
  ambientes: AmbienteEntrada[];
  unidadeDetectada: UnidadeDesenho;
  poligonosLidos: number;
  avisos: string[];
}

/**
 * Extrai ambientes de um DXF: cada polilinha fechada vira um ambiente
 * (área de piso + perímetro), com o texto interno como nome.
 */
export function parseDxf(conteudo: string, unidade?: UnidadeDesenho): ResultadoDxf {
  const avisos: string[] = [];
  const parser = new DxfParser();
  let dxf: any;
  try {
    dxf = parser.parseSync(conteudo);
  } catch (e) {
    throw new Error("Arquivo DXF inválido ou corrompido: " + (e instanceof Error ? e.message : ""));
  }

  const entidades: any[] = dxf?.entities ?? [];
  const poligonos: Poligono[] = [];
  const textos: Texto[] = [];

  for (const ent of entidades) {
    const type = ent.type;
    if (type === "LWPOLYLINE" || type === "POLYLINE") {
      const verts = (ent.vertices ?? []).map((v: any) => ({ x: v.x ?? 0, y: v.y ?? 0 }));
      // fechada: flag shape OU 70&1, ou primeiro==último
      const fechada = ent.shape || (ent.flags & 1) === 1 || verts.length >= 3;
      if (verts.length >= 3 && fechada) {
        poligonos.push({ pts: verts, layer: ent.layer ?? "0" });
      }
    } else if (type === "TEXT" || type === "MTEXT") {
      const t = (ent.text ?? "").toString().replace(/\\[A-Za-z0-9.|]+;?/g, "").trim();
      const pos = ent.startPoint ?? ent.position ?? { x: ent.x, y: ent.y };
      if (t && pos && pos.x != null && pos.y != null) {
        textos.push({ x: pos.x, y: pos.y, texto: t });
      }
    }
  }

  if (poligonos.length === 0) {
    throw new Error("Nenhuma polilinha fechada encontrada no DXF. Desenhe os ambientes como polilinhas fechadas (LWPOLYLINE) ou use a planilha.");
  }

  // Detecta unidade pela mediana das áreas cruas (heurística).
  const areasCruas = poligonos.map((p) => areaPoligono(p.pts)).sort((a, b) => a - b);
  const mediana = areasCruas[Math.floor(areasCruas.length / 2)] || 0;
  let uni: UnidadeDesenho = unidade ?? "m";
  if (!unidade) {
    if (mediana > 1e6) uni = "mm";        // ~m² em mm² fica na casa dos milhões
    else if (mediana > 5e3) uni = "cm";   // ~m² em cm² fica na casa dos milhares
    else uni = "m";
    if (uni !== "m") avisos.push(`Unidade do desenho detectada como ${uni} (áreas muito grandes em metros). Confirme na tela.`);
  }
  const f = FATOR[uni];       // escala linear
  const f2 = f * f;           // escala de área

  const ambientes: AmbienteEntrada[] = poligonos.map((poly, i) => {
    const areaPiso = areaPoligono(poly.pts) * f2;
    const perimetro = perimetroPoligono(poly.pts) * f;
    const c = centro(poly.pts);
    // acha o texto mais próximo que esteja DENTRO do polígono
    const interno = textos
      .filter((t) => dentro({ x: t.x, y: t.y }, poly.pts))
      .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
    const nome = interno?.texto || poly.layer || `Ambiente ${i + 1}`;
    return {
      nome,
      areaPiso: Math.round(areaPiso * 100) / 100,
      perimetro: Math.round(perimetro * 100) / 100,
      tipo: classificarNome(nome),
      origem: `DXF · layer ${poly.layer}`,
    };
  });

  // descarta ruído (áreas < 0,5 m² viram provável cota/detalhe, mas mantém aviso)
  const filtrados = ambientes.filter((a) => a.areaPiso >= 0.5);
  if (filtrados.length < ambientes.length) {
    avisos.push(`${ambientes.length - filtrados.length} polígono(s) menor(es) que 0,5 m² ignorados (prováveis cotas/detalhes).`);
  }

  return {
    ambientes: filtrados,
    unidadeDetectada: uni,
    poligonosLidos: poligonos.length,
    avisos,
  };
}
