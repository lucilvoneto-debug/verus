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

// ---------- Extração por ETIQUETA de área (nome + "N,NN m²" em texto) ----------

const RE_AREA = /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*m\s*[²2]/i;
// textos que NÃO são nome de ambiente (título de prancha, escala, cota, nota técnica)
const RE_LIXO = /planta|escala|1\s*[\/:]\s*\d|projeto|prancha|folha|data|rev\b|revis|norma|nbr|abnt|obs\b|detalhe|legenda|quadro|total|soma|áreas:|areas:|cliente|resp\b|arquiteto|engenheiro|prof\.|profundidade|espessura|n[íi]vel|cota|=\s*\d|[øØ]|^rua\b|avenida|^av\.|logradouro|desnível|desnivel|projeç|informaç|informac|ltda|s\.?\/?a\.?\b|eireli|cnpj|apoio administrativo|serviços de apoio|incorpora|construtora|empreendiment/i;

/** Converte "2.33m²", "4.320,70 m²", "57,25m²" em número (m²). */
export function parseAreaTexto(raw: string): number | null {
  const m = raw.match(RE_AREA);
  if (!m) return null;
  let s = m[1];
  const ponto = s.includes("."), virg = s.includes(",");
  if (ponto && virg) s = s.replace(/\./g, "").replace(",", ".");
  else if (virg) s = s.replace(",", ".");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Nome limpo a partir de um texto (remove a parte da área, se houver). */
function nomeDeTexto(t: string): string {
  return t.replace(RE_AREA, "").replace(/\s+/g, " ").replace(/[:\-–]\s*$/, "").trim();
}

function ehNomeValido(t: string): boolean {
  const s = t.trim();
  if (s.length < 2 || s.length > 45) return false;
  if (RE_LIXO.test(s)) return false;
  const letras = (s.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  return letras >= 2; // precisa ter letras (não é só número/cota)
}

/**
 * Extrai ambientes a partir das ETIQUETAS de área anotadas no desenho.
 * Cada texto "N,NN m²" vira um ambiente; o nome vem do próprio texto (se tiver
 * letras) ou do rótulo de texto mais próximo. Perímetro e unidade são
 * autocalibrados pelo menor polígono que contém a etiqueta (se existir).
 */
/** Acima disso não é ambiente — é total de prédio / linha de quadro de áreas. */
const LIMITE_AMBIENTE_M2 = 2000;
/** Convenção de tag de sala do arquiteto: "A=12,34 m²". */
const RE_TAG_A = /A\s*=\s*[\d.]*\d,\d{2}\s*m\s*[²2]/i;

export function ambientesDeTags(
  poligonos: PoligonoGeo[],
  textos: TextoGeo[],
  origem: string
): ResultadoGeo {
  const avisos: string[] = [];

  const temTagA = textos.filter((t) => RE_TAG_A.test(t.texto)).length >= 3;

  let brutas = textos
    .map((t) => ({ t, area: parseAreaTexto(t.texto), isA: RE_TAG_A.test(t.texto) }))
    .filter((x): x is { t: TextoGeo; area: number; isA: boolean } => x.area != null && x.area >= 0.3);

  // 1) corta número gigante = quadro de áreas / total do prédio (não é ambiente)
  const gigantes = brutas.filter((x) => x.area > LIMITE_AMBIENTE_M2).length;
  brutas = brutas.filter((x) => x.area <= LIMITE_AMBIENTE_M2);
  if (gigantes) avisos.push(`${gigantes} número(s) grande(s) (> ${LIMITE_AMBIENTE_M2} m²) ignorado(s) — provável quadro de áreas do prédio, não ambiente.`);

  // 2) se o desenho usa a convenção de sala "A=", usa SÓ ela (ignora número solto de tabela)
  if (temTagA) {
    const antes = brutas.length;
    brutas = brutas.filter((x) => x.isA);
    if (brutas.length < antes) avisos.push(`Usando só as etiquetas de sala "A=" (${brutas.length}); ${antes - brutas.length} número(s) solto(s) do desenho ignorado(s).`);
  }

  if (brutas.length === 0) throw new Error("Sem etiquetas de área úteis.");

  // 3) dedupe por (valor + posição) — mata cópia exata da mesma etiqueta
  const vistosPos = new Set<string>();
  const etiquetas = brutas.filter((x) => {
    const k = `${Math.round(x.area * 100)}@${Math.round(x.t.x / 30)}_${Math.round(x.t.y / 30)}`;
    if (vistosPos.has(k)) return false;
    vistosPos.add(k);
    return true;
  });

  // candidatos a NOME: textos sem área, com letras, que não sejam lixo
  const rotulos = textos.filter((t) => !RE_AREA.test(t.texto) && ehNomeValido(t.texto));

  let estimados = 0;
  const ambientes: AmbienteEntrada[] = etiquetas.map(({ t, area }, i) => {
    // nome: do próprio texto se sobrar letras; senão rótulo mais próximo
    let nome = nomeDeTexto(t.texto);
    if (!ehNomeValido(nome)) {
      const rot = rotulos
        .map((r) => ({ r, d: Math.hypot(r.x - t.x, r.y - t.y) }))
        .sort((a, b) => a.d - b.d)[0];
      nome = rot?.r.texto?.trim() || `Ambiente ${i + 1}`;
    }

    // menor polígono que contém a etiqueta → perímetro real + calibra unidade
    let perimetro = 0;
    const contendo = poligonos
      .filter((p) => dentro({ x: t.x, y: t.y }, p.pts))
      .map((p) => ({ p, aDes: areaPoligono(p.pts) }))
      .filter((x) => x.aDes > 0)
      .sort((a, b) => a.aDes - b.aDes)[0];
    if (contendo) {
      const fator = Math.sqrt(area / contendo.aDes); // unidade por ambiente
      perimetro = Math.round(perimetroPoligono(contendo.p.pts) * fator * 100) / 100;
    } else {
      perimetro = Math.round(4.5 * Math.sqrt(area) * 100) / 100; // estimativa p/ retângulo
      estimados++;
    }

    return {
      nome,
      areaPiso: Math.round(area * 100) / 100,
      perimetro,
      tipo: classificarNome(nome),
      origem: `${origem} · etiqueta`,
    };
  });

  // dedupe por nome+área (etiqueta repetida em cortes/viewports)
  const vistos = new Set<string>();
  const unicos = ambientes.filter((a) => {
    const k = `${a.nome}|${a.areaPiso}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  if (unicos.length < ambientes.length) avisos.push(`${ambientes.length - unicos.length} etiqueta(s) repetida(s) removida(s).`);
  if (estimados > 0) avisos.push(`${estimados} ambiente(s) com perímetro ESTIMADO (sem contorno fechado) — confirme pro rodapé.`);

  // aviso multi-prancha: mesma área repetindo muito = desenho com várias pranchas
  const cont = new Map<number, number>();
  for (const a of unicos) cont.set(a.areaPiso, (cont.get(a.areaPiso) ?? 0) + 1);
  const repetidos = Array.from(cont.values()).filter((n) => n >= 4).length;
  if (repetidos >= 2) {
    avisos.push("⚠ Desenho parece ter VÁRIAS PRANCHAS (mesma área repetida em muitos lugares). A mesma sala pode estar contada mais de uma vez — confira a lista, remova duplicatas ou filtre por prancha/layer antes de fechar.");
  }

  return { ambientes: unicos, unidadeDetectada: "m", poligonosLidos: poligonos.length, avisos };
}

/**
 * Estratégia adaptativa: se o desenho tem etiquetas de área ("N,NN m²"),
 * usa elas (confiável). Senão cai pro modo geométrico (polilinhas fechadas).
 */
export function extrairAmbientes(
  poligonos: PoligonoGeo[],
  textos: TextoGeo[],
  origem: string,
  opcoes?: UnidadeDesenho | OpcoesGeo
): ResultadoGeo {
  const comArea = textos.filter((t) => RE_AREA.test(t.texto)).length;
  if (comArea >= 3) {
    try {
      const r = ambientesDeTags(poligonos, textos, origem);
      r.avisos.unshift(`Modo etiqueta: ${r.ambientes.length} ambiente(s) lidos das áreas anotadas no desenho.`);
      return r;
    } catch {
      /* sem etiquetas úteis — cai pro geométrico */
    }
  }
  return ambientesDeGeometria(poligonos, textos, origem, opcoes);
}
