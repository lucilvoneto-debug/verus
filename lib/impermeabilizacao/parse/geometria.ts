import type { AmbienteEntrada } from "../regras";
import { classificarNome } from "../classificar";

/**
 * Núcleo de geometria compartilhado por DXF e DWG.
 * Recebe polígonos (contornos fechados) + textos (rótulos) já normalizados
 * e devolve a lista de ambientes com área de piso + perímetro.
 */

export type UnidadeDesenho = "m" | "cm" | "mm";

export interface Ponto { x: number; y: number }
export interface PoligonoGeo { pts: Ponto[]; layer: string }
export interface TextoGeo { x: number; y: number; texto: string }

const FATOR: Record<UnidadeDesenho, number> = { m: 1, cm: 0.01, mm: 0.001 };

export function areaPoligono(pts: Ponto[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(a) / 2;
}

export function perimetroPoligono(pts: Ponto[]): number {
  let p = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    p += Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y);
  }
  return p;
}

export function dentro(pt: Ponto, poly: Ponto[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    const intersect = yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function centro(pts: Ponto[]): Ponto {
  const s = pts.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
}

export interface ResultadoGeo {
  ambientes: AmbienteEntrada[];
  unidadeDetectada: UnidadeDesenho;
  poligonosLidos: number;
  avisos: string[];
}

/** Detecta unidade do desenho pela mediana das áreas cruas. */
export function detectarUnidade(poligonos: PoligonoGeo[]): UnidadeDesenho {
  const areas = poligonos.map((p) => areaPoligono(p.pts)).sort((a, b) => a - b);
  const mediana = areas[Math.floor(areas.length / 2)] || 0;
  if (mediana > 1e6) return "mm";
  if (mediana > 5e3) return "cm";
  return "m";
}

export interface OpcoesGeo {
  unidade?: UnidadeDesenho;
  /** Ignora polígonos com área acima disso (m²) — corta bordas de prancha/viewport. */
  areaMaxM2?: number;
  /** Só considera polígonos nestes layers (se vazio, todos). */
  layers?: string[];
}

/** Converte polígonos + textos em ambientes (piso + perímetro), com nome do texto interno. */
export function ambientesDeGeometria(
  poligonos: PoligonoGeo[],
  textos: TextoGeo[],
  origem: string,
  opcoes?: UnidadeDesenho | OpcoesGeo
): ResultadoGeo {
  const opts: OpcoesGeo = typeof opcoes === "string" ? { unidade: opcoes } : (opcoes ?? {});
  const unidade = opts.unidade;
  const avisos: string[] = [];
  if (poligonos.length === 0) {
    throw new Error("Nenhuma polilinha fechada encontrada. Desenhe os ambientes como polilinhas fechadas ou use a planilha.");
  }

  // filtra por layer, se pedido
  if (opts.layers && opts.layers.length) {
    const set = new Set(opts.layers);
    poligonos = poligonos.filter((p) => set.has(p.layer));
  }

  // dedupe: polígonos com mesma área+centro arredondados (bordas repetidas em viewports)
  const vistos = new Set<string>();
  const antes = poligonos.length;
  poligonos = poligonos.filter((p) => {
    const a = Math.round(areaPoligono(p.pts));
    const c = centro(p.pts);
    const chave = `${a}|${Math.round(c.x)}|${Math.round(c.y)}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
  if (poligonos.length < antes) avisos.push(`${antes - poligonos.length} polígono(s) duplicado(s) removido(s).`);

  let uni: UnidadeDesenho = unidade ?? detectarUnidade(poligonos);
  if (!unidade && uni !== "m") {
    avisos.push(`Unidade do desenho detectada como ${uni} (áreas grandes demais em metros). Confirme na tela.`);
  }
  const f = FATOR[uni];
  const f2 = f * f;

  const ambientes: AmbienteEntrada[] = poligonos.map((poly, i) => {
    const areaPiso = areaPoligono(poly.pts) * f2;
    const perimetro = perimetroPoligono(poly.pts) * f;
    const c = centro(poly.pts);
    const interno = textos
      .filter((t) => dentro({ x: t.x, y: t.y }, poly.pts))
      .sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
    const nome = interno?.texto || poly.layer || `Ambiente ${i + 1}`;
    return {
      nome,
      areaPiso: Math.round(areaPiso * 100) / 100,
      perimetro: Math.round(perimetro * 100) / 100,
      tipo: classificarNome(nome),
      origem: `${origem} · layer ${poly.layer}`,
    };
  });

  const areaMax = opts.areaMaxM2 && opts.areaMaxM2 > 0 ? opts.areaMaxM2 : Infinity;
  const filtrados = ambientes.filter((a) => a.areaPiso >= 0.5 && a.areaPiso <= areaMax);
  const pequenos = ambientes.filter((a) => a.areaPiso < 0.5).length;
  const grandes = ambientes.filter((a) => a.areaPiso > areaMax).length;
  if (pequenos) avisos.push(`${pequenos} polígono(s) < 0,5 m² ignorados (cotas/detalhes).`);
  if (grandes) avisos.push(`${grandes} polígono(s) > ${areaMax} m² ignorados (bordas de prancha/viewport).`);

  return { ambientes: filtrados, unidadeDetectada: uni, poligonosLidos: poligonos.length, avisos };
}
