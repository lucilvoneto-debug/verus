"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { WeatherIcon, isChuva, condicaoLabel } from "@/lib/weather-icons";
import type { AgendaItem } from "@/app/api/agenda/route";
import type { WeatherDay } from "@/lib/weather";

type Modo = "lista" | "calendario" | "risco";
type Periodo = "semana" | "mes";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0 dom .. 6 sab
  // Segunda como início
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const tipoBadge: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  VISITA: "blue",
  OBRA_INICIO: "green",
  OBRA_FIM: "yellow",
  ETAPA: "neutral",
};
const tipoLabel: Record<string, string> = {
  VISITA: "Visita",
  OBRA_INICIO: "Obra (início)",
  OBRA_FIM: "Obra (previsão fim)",
  ETAPA: "Etapa",
};

export default function AgendaPage() {
  const [modo, setModo] = useState<Modo>("lista");
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [ref, setRef] = useState<Date>(() => new Date());

  const { inicio, fim } = useMemo(() => {
    if (periodo === "semana") {
      const i = startOfWeek(ref);
      return { inicio: i, fim: addDays(i, 6) };
    }
    return { inicio: startOfMonth(ref), fim: endOfMonth(ref) };
  }, [periodo, ref]);

  const inicioISO = toISODate(inicio);
  const fimISO = toISODate(fim);

  const { data, isLoading } = useQuery<{ data: AgendaItem[] }>({
    queryKey: ["agenda", inicioISO, fimISO],
    queryFn: async () => {
      const res = await fetch(`/api/agenda?inicio=${inicioISO}&fim=${fimISO}`);
      if (!res.ok) throw new Error("Erro ao carregar agenda");
      return res.json();
    },
  });

  const itens = data?.data ?? [];

  function navega(delta: number) {
    if (periodo === "semana") setRef((d) => addDays(d, delta * 7));
    else setRef((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Agenda</h2>
          <p className="text-sm text-gray-500">
            Visitas, obras e etapas — com termômetro de chuva integrado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPeriodo("semana")}
              className={`px-3 py-1 text-sm rounded-md ${
                periodo === "semana" ? "bg-white shadow-sm" : "text-gray-600"
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriodo("mes")}
              className={`px-3 py-1 text-sm rounded-md ${
                periodo === "mes" ? "bg-white shadow-sm" : "text-gray-600"
              }`}
            >
              Mês
            </button>
          </div>
          <button onClick={() => navega(-1)} className="btn-outline px-2 py-1.5">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setRef(new Date())} className="btn-outline px-3 py-1.5 text-sm">
            Hoje
          </button>
          <button onClick={() => navega(1)} className="btn-outline px-2 py-1.5">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            <span className="font-medium">{formatDate(inicio)}</span>
            <span className="text-gray-400 mx-2">→</span>
            <span className="font-medium">{formatDate(fim)}</span>
            <span className="text-gray-500 ml-3">· {itens.length} item(ns)</span>
          </div>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(["lista", "calendario", "risco"] as Modo[]).map((m) => (
              <button
                key={m}
                onClick={() => setModo(m)}
                className={`px-3 py-1 text-sm rounded-md capitalize ${
                  modo === m ? "bg-white shadow-sm" : "text-gray-600"
                }`}
              >
                {m === "calendario" ? "Calendário" : m === "risco" ? "Risco" : "Lista"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {isLoading && <div className="text-gray-500 text-sm">Carregando...</div>}

      {!isLoading && modo === "lista" && <ListaView itens={itens} />}
      {!isLoading && modo === "calendario" && (
        <CalendarioView itens={itens} inicio={inicio} fim={fim} />
      )}
      {!isLoading && modo === "risco" && <RiscoView itens={itens} />}
    </div>
  );
}

function ListaView({ itens }: { itens: AgendaItem[] }) {
  if (itens.length === 0) {
    return (
      <Card>
        <p className="text-center text-gray-500 py-8 text-sm">Nada agendado neste período.</p>
      </Card>
    );
  }
  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="table-verus">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Endereço</th>
              <th>Responsável</th>
              <th>Tempo</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => {
              const chuvaForte = it.weather?.condicao === "chuva-forte";
              return (
                <tr
                  key={it.id}
                  className={chuvaForte ? "bg-amber-50" : undefined}
                >
                  <td className="tabular-nums whitespace-nowrap">
                    {new Date(it.data).toLocaleDateString("pt-BR")}{" "}
                    <span className="text-gray-500 text-xs">
                      {new Date(it.data).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td>
                    <Badge tone={tipoBadge[it.tipo] ?? "neutral"}>
                      {tipoLabel[it.tipo] ?? it.tipo}
                    </Badge>
                  </td>
                  <td>
                    {it.href ? (
                      <Link href={it.href} className="font-medium hover:text-brand">
                        {it.titulo}
                      </Link>
                    ) : (
                      <span className="font-medium">{it.titulo}</span>
                    )}
                    {chuvaForte && (
                      <Badge tone="red" className="ml-2">
                        Atenção: chuva
                      </Badge>
                    )}
                  </td>
                  <td className="text-sm text-gray-600 max-w-xs truncate">
                    {it.endereco ?? "—"}
                  </td>
                  <td className="text-sm">{it.responsavel ?? "—"}</td>
                  <td>
                    <WeatherIcon weather={it.weather} showTemp />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CalendarioView({
  itens,
  inicio,
  fim,
}: {
  itens: AgendaItem[];
  inicio: Date;
  fim: Date;
}) {
  // Para mês, ainda renderizamos por linhas semanais; para simplicidade
  // mostramos os 7 dias da semana de referência se semana, ou todos os
  // dias do mês em grade 7-col com células vazias.
  const dias: Date[] = [];
  if ((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24) < 8) {
    for (let i = 0; i < 7; i++) dias.push(addDays(inicio, i));
  } else {
    // mês: começa do início da semana do dia 1 até completar grade
    const start = startOfWeek(inicio);
    const totalDias =
      Math.ceil(
        (endOfMonth(inicio).getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    const grade = Math.ceil(totalDias / 7) * 7;
    for (let i = 0; i < grade; i++) dias.push(addDays(start, i));
  }

  const porDia = new Map<string, AgendaItem[]>();
  for (const it of itens) {
    const k = toISODate(new Date(it.data));
    const arr = porDia.get(k) ?? [];
    arr.push(it);
    porDia.set(k, arr);
  }

  // Pega weather do primeiro item do dia (todos do mesmo endereço terão o mesmo).
  function weatherDoDia(diaISO: string): WeatherDay | null {
    const arr = porDia.get(diaISO) ?? [];
    for (const it of arr) {
      if (it.weather) return it.weather;
    }
    return null;
  }

  const nomesDias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100 text-xs text-gray-500 font-medium">
        {nomesDias.map((n) => (
          <div key={n} className="px-2 py-2 text-center">
            {n}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((d) => {
          const iso = toISODate(d);
          const items = porDia.get(iso) ?? [];
          const w = weatherDoDia(iso);
          const dentroPeriodo = d >= startOfMonth(inicio) && d <= endOfMonth(inicio);
          const chuvaForte = w?.condicao === "chuva-forte";
          return (
            <div
              key={iso}
              className={`min-h-[110px] border-r border-b border-gray-100 p-2 text-xs ${
                !dentroPeriodo ? "bg-gray-50/60 text-gray-400" : ""
              } ${chuvaForte ? "bg-amber-50" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium tabular-nums">{d.getDate()}</span>
                {w ? (
                  <span className="flex items-center gap-1">
                    <WeatherIcon weather={w} />
                    <span className="text-gray-500 tabular-nums">
                      {Math.round(w.tempMax)}°
                    </span>
                  </span>
                ) : null}
              </div>
              <div className="space-y-1">
                {items.slice(0, 4).map((it) => (
                  <Link
                    key={it.id}
                    href={it.href ?? "#"}
                    title={`${tipoLabel[it.tipo]}: ${it.titulo}`}
                    className={`block truncate rounded px-1.5 py-0.5 text-[11px] border ${
                      it.tipo === "VISITA"
                        ? "bg-blue-50 border-blue-100 text-blue-800"
                        : it.tipo === "OBRA_INICIO"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                        : it.tipo === "OBRA_FIM"
                        ? "bg-amber-50 border-amber-100 text-amber-800"
                        : "bg-gray-100 border-gray-200 text-gray-700"
                    }`}
                  >
                    {it.titulo}
                  </Link>
                ))}
                {items.length > 4 && (
                  <div className="text-[11px] text-gray-500">+{items.length - 4} mais</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RiscoView({ itens }: { itens: AgendaItem[] }) {
  const arriscados = itens
    .filter((it) => it.weather && isChuva(it.weather.condicao))
    .sort((a, b) => a.data.localeCompare(b.data));
  const [reagendar, setReagendar] = useState<AgendaItem | null>(null);

  if (arriscados.length === 0) {
    return (
      <Card>
        <div className="flex items-center gap-3 py-6 justify-center text-gray-500 text-sm">
          <AlertTriangle className="w-5 h-5 text-emerald-500" />
          Sem risco de chuva nos itens deste período.
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-0">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <h3 className="font-display text-lg font-semibold">
            Itens com chuva prevista ({arriscados.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Título</th>
                <th>Endereço</th>
                <th>Previsão</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {arriscados.map((it) => (
                <tr
                  key={it.id}
                  className={
                    it.weather?.condicao === "chuva-forte" ? "bg-amber-50" : undefined
                  }
                >
                  <td className="tabular-nums whitespace-nowrap">
                    {new Date(it.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td>
                    <Badge tone={tipoBadge[it.tipo] ?? "neutral"}>
                      {tipoLabel[it.tipo] ?? it.tipo}
                    </Badge>
                  </td>
                  <td className="font-medium">{it.titulo}</td>
                  <td className="text-sm text-gray-600 max-w-xs truncate">
                    {it.endereco ?? "—"}
                  </td>
                  <td className="text-sm">
                    <span className="inline-flex items-center gap-1">
                      <WeatherIcon weather={it.weather} />
                      <span>
                        {it.weather && condicaoLabel[it.weather.condicao]} ·{" "}
                        {it.weather?.probChuva}% ({it.weather?.chuvaMm.toFixed(1)} mm)
                      </span>
                    </span>
                  </td>
                  <td className="text-right pr-4">
                    <button
                      onClick={() => setReagendar(it)}
                      className="btn-outline text-xs px-2 py-1"
                    >
                      Sugerir reagendamento
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {reagendar && (
        <ReagendarModal item={reagendar} onClose={() => setReagendar(null)} />
      )}
    </>
  );
}

function ReagendarModal({ item, onClose }: { item: AgendaItem; onClose: () => void }) {
  const { data } = useQuery<{ forecast: WeatherDay[] | null }>({
    queryKey: ["clima-reagendar", item.endereco, item.data],
    queryFn: async () => {
      if (!item.endereco) return { forecast: null };
      const res = await fetch(
        `/api/clima?endereco=${encodeURIComponent(item.endereco)}&data=${toISODate(
          new Date(item.data)
        )}`
      );
      if (!res.ok) return { forecast: null };
      return res.json();
    },
    enabled: !!item.endereco,
  });

  const apartirISO = toISODate(new Date(item.data));
  const candidatos = (data?.forecast ?? [])
    .filter((d) => d.data > apartirISO)
    .filter((d) => d.condicao === "limpo" || d.condicao === "nublado")
    .slice(0, 3);

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Sugestão de reagendamento</h3>
            <p className="text-xs text-gray-500">
              {item.titulo} · originalmente em{" "}
              {new Date(item.data).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!item.endereco && (
          <p className="text-sm text-gray-500">Item sem endereço — não é possível prever.</p>
        )}
        {item.endereco && candidatos.length === 0 && (
          <p className="text-sm text-gray-500">
            Não foram encontrados dias secos nos próximos 7 dias.
          </p>
        )}
        {candidatos.length > 0 && (
          <ul className="space-y-2">
            {candidatos.map((c) => (
              <li
                key={c.data}
                className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2"
              >
                <div>
                  <div className="font-medium">
                    {new Date(c.data).toLocaleDateString("pt-BR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {condicaoLabel[c.condicao]} · {Math.round(c.tempMin)}°/
                    {Math.round(c.tempMax)}° · {c.probChuva}% chuva
                  </div>
                </div>
                <WeatherIcon weather={c} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 text-right">
          <button onClick={onClose} className="btn-outline">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
