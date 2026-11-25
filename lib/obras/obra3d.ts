/**
 * Obras com página 3D própria.
 *
 * A página é um arquivo fixo em public/obra3d/<pasta>/index.html: abre sem login, por um
 * endereço difícil de adivinhar, e não aparece em busca. A medição marcada nela fica na
 * tabela Configuracao (chave obra3d.<slug>.medicao). A página grava pela rota aberta
 * /api/obra/obra3d/<pasta>/medicao: quem tem o endereço da página vê e marca, sem login.
 * /api/obras/obra3d/<slug>/medicao faz o mesmo com login.
 */
export type Obra3D = { slug: string; pasta: string; titulo: string; casa: RegExp };

export const OBRAS_3D: Obra3D[] = [
  { slug: "mahi-patacho", pasta: "mahi-patacho-2a82b419", titulo: "Mahi Patacho em 3D", casa: /mahi|patacho/i },
];

/** Acha a página 3D pelo nome da obra (ou do cliente). */
export function obra3dDe(texto: string): Obra3D | null {
  return OBRAS_3D.find((o) => o.casa.test(texto)) ?? null;
}

export function obra3dPorSlug(slug: string): Obra3D | null {
  return OBRAS_3D.find((o) => o.slug === slug) ?? null;
}

/** A pasta leva um código no fim: serve de chave do link sem login. */
export function obra3dPorPasta(pasta: string): Obra3D | null {
  return OBRAS_3D.find((o) => o.pasta === pasta) ?? null;
}

export function urlObra3d(o: Obra3D): string {
  return `/obra3d/${o.pasta}/index.html`;
}

export function chaveMedicao(slug: string): string {
  return `obra3d.${slug}.medicao`;
}

/** s: 1 = em execução, 2 = concluído. d: data (AAAA-MM-DD) em que foi marcado. */
export type Marca = { s: 1 | 2; d: string };
export type Medicao3D = Record<string, Marca>;

const ID_AREA = /^[A-Za-z0-9_-]{3,80}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_AREAS_POR_ENVIO = 1000;

/**
 * Junta o que a página mandou com o que já estava gravado. Área com s = 0 sai da lista
 * (voltou a "não iniciado"). Qualquer coisa fora do formato é ignorada.
 */
export function juntaMedicao(atual: Medicao3D, patch: unknown): Medicao3D {
  const out: Medicao3D = { ...atual };
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return out;
  const pares = Object.entries(patch as Record<string, unknown>).slice(0, MAX_AREAS_POR_ENVIO);
  for (const [id, v] of pares) {
    if (!ID_AREA.test(id) || !v || typeof v !== "object") continue;
    const s = Number((v as { s?: unknown }).s);
    const d = String((v as { d?: unknown }).d ?? "");
    if (s === 0) delete out[id];
    else if ((s === 1 || s === 2) && DATA.test(d)) out[id] = { s, d };
  }
  return out;
}

export function leMedicao(valor: string | null | undefined): Medicao3D {
  if (!valor) return {};
  try {
    return juntaMedicao({}, JSON.parse(valor));
  } catch {
    return {};
  }
}
