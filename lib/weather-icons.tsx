import { cn } from "@/lib/utils";
import type { WeatherCondicao, WeatherDay } from "@/lib/weather";

export const condicaoLabel: Record<WeatherCondicao, string> = {
  limpo: "Tempo limpo",
  nublado: "Nublado",
  "chuva-fraca": "Chuva fraca",
  "chuva-forte": "Chuva forte",
};

export const condicaoEmoji: Record<WeatherCondicao, string> = {
  limpo: "☀️",
  nublado: "🌥",
  "chuva-fraca": "🌦",
  "chuva-forte": "⛈",
};

const condicaoColor: Record<WeatherCondicao, string> = {
  limpo: "text-amber-500",
  nublado: "text-gray-500",
  "chuva-fraca": "text-sky-500",
  "chuva-forte": "text-red-600",
};

export function WeatherIcon({
  weather,
  showTemp = false,
  className,
}: {
  weather: WeatherDay | null | undefined;
  showTemp?: boolean;
  className?: string;
}) {
  if (!weather) {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-gray-400 text-xs", className)}
        title="Sem previsão"
      >
        <span aria-hidden>—</span>
      </span>
    );
  }
  const tip = `${condicaoLabel[weather.condicao]} · ${Math.round(
    weather.tempMin
  )}°/${Math.round(weather.tempMax)}° · ${weather.probChuva}% chuva (${weather.chuvaMm.toFixed(
    1
  )} mm)`;
  return (
    <span
      title={tip}
      className={cn(
        "inline-flex items-center gap-1 text-sm",
        condicaoColor[weather.condicao],
        className
      )}
    >
      <span aria-hidden>{condicaoEmoji[weather.condicao]}</span>
      {showTemp && (
        <span className="tabular-nums text-xs text-gray-700">
          {Math.round(weather.tempMax)}°
        </span>
      )}
    </span>
  );
}

export function isChuva(c: WeatherCondicao): boolean {
  return c === "chuva-fraca" || c === "chuva-forte";
}
