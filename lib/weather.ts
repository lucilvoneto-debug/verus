/**
 * Helper de previsão do tempo via Open-Meteo (gratuito, sem API key).
 * Cache em memória com TTL de 1h. Em ambiente serverless da Vercel,
 * cada cold start refaz a chamada (sem custo).
 */

const BASE_URL = process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com";
const TTL_MS = 60 * 60 * 1000; // 1 hora

export type WeatherCondicao = "limpo" | "nublado" | "chuva-fraca" | "chuva-forte";

export interface WeatherDay {
  data: string; // YYYY-MM-DD
  tempMax: number;
  tempMin: number;
  chuvaMm: number;
  probChuva: number;
  condicao: WeatherCondicao;
}

interface CacheEntry {
  expires: number;
  data: WeatherDay[];
}

const cache = new Map<string, CacheEntry>();

function classify(chuvaMm: number, probChuva: number): WeatherCondicao {
  if (chuvaMm > 10 || probChuva >= 80) return "chuva-forte";
  if (chuvaMm > 1 || probChuva >= 50) return "chuva-fraca";
  if (probChuva >= 20) return "nublado";
  return "limpo";
}

interface OpenMeteoResponse {
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
}

export async function getForecast(lat: number, lng: number): Promise<WeatherDay[]> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expires > now) return cached.data;

  const url = new URL("/v1/forecast", BASE_URL);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"
  );
  url.searchParams.set("timezone", "America/Sao_Paulo");
  url.searchParams.set("forecast_days", "7");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Open-Meteo respondeu ${res.status}`);

  const json = (await res.json()) as OpenMeteoResponse;
  const d = json.daily;
  if (!d || !d.time?.length) throw new Error("Resposta Open-Meteo sem 'daily'");

  const days: WeatherDay[] = d.time.map((data, i) => {
    const chuvaMm = d.precipitation_sum[i] ?? 0;
    const probChuva = d.precipitation_probability_max[i] ?? 0;
    return {
      data,
      tempMax: d.temperature_2m_max[i] ?? 0,
      tempMin: d.temperature_2m_min[i] ?? 0,
      chuvaMm,
      probChuva,
      condicao: classify(chuvaMm, probChuva),
    };
  });

  cache.set(key, { expires: now + TTL_MS, data: days });
  return days;
}

/** Retorna o WeatherDay correspondente a uma data específica (YYYY-MM-DD) ou null. */
export function pickDay(forecast: WeatherDay[], dataISO: string): WeatherDay | null {
  return forecast.find((d) => d.data === dataISO) ?? null;
}

/** Próximos N dias secos a partir de uma data (limpo|nublado). */
export function proximosDiasSecos(
  forecast: WeatherDay[],
  apartirDe: string,
  qtd = 3
): WeatherDay[] {
  return forecast
    .filter((d) => d.data >= apartirDe)
    .filter((d) => d.condicao === "limpo" || d.condicao === "nublado")
    .slice(0, qtd);
}
