/**
 * Geocoding via Open-Meteo Geocoding API (gratuito, sem API key).
 * Cache em memória com TTL de 24h.
 */

const BASE_URL = "https://geocoding-api.open-meteo.com";
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface GeocodeResult {
  lat: number;
  lng: number;
  cidade: string;
}

interface CacheEntry {
  expires: number;
  data: GeocodeResult | null;
}

const cache = new Map<string, CacheEntry>();

function normalize(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

interface GeocodingResponse {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    admin1?: string;
    country?: string;
  }>;
}

/**
 * Estratégia: a busca do Open-Meteo é por cidade. Tentamos extrair a parte
 * mais "buscável" do endereço (após a vírgula final tende a ser cidade/UF).
 * Se falhar, tentamos a string inteira.
 */
function candidatos(endereco: string): string[] {
  const partes = endereco
    .split(/[,\-\n]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const lista: string[] = [];
  // últimas 2 partes (geralmente cidade, UF) e últimas 3
  if (partes.length >= 2) lista.push(partes.slice(-2).join(", "));
  if (partes.length >= 1) lista.push(partes[partes.length - 1]);
  lista.push(endereco);
  return Array.from(new Set(lista.filter((s) => s.length >= 3)));
}

export async function geocodeEndereco(endereco: string): Promise<GeocodeResult | null> {
  const key = normalize(endereco);
  if (!key) return null;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) return cached.data;

  for (const candidato of candidatos(endereco)) {
    try {
      const url = new URL("/v1/search", BASE_URL);
      url.searchParams.set("name", candidato);
      url.searchParams.set("count", "1");
      url.searchParams.set("language", "pt");
      url.searchParams.set("format", "json");

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) continue;
      const json = (await res.json()) as GeocodingResponse;
      const r = json.results?.[0];
      if (r) {
        const out: GeocodeResult = {
          lat: r.latitude,
          lng: r.longitude,
          cidade: [r.name, r.admin1].filter(Boolean).join(" - "),
        };
        cache.set(key, { expires: now + TTL_MS, data: out });
        return out;
      }
    } catch {
      // tenta próximo candidato
    }
  }

  cache.set(key, { expires: now + TTL_MS, data: null });
  return null;
}
