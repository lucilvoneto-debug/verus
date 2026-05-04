"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { etapaStatusLabel, etapaStatusTone } from "@/lib/status";
import { Plus } from "lucide-react";
import { WeatherIcon } from "@/lib/weather-icons";
import type { WeatherDay } from "@/lib/weather";
import { useObra } from "@/hooks/useObras";

type Etapa = {
  id: string;
  ordem: number;
  nome: string;
  status: string;
  dataPrevista: string;
  dataRealizada: string | null;
  responsavelId: string | null;
};

function pickDayLocal(forecast: WeatherDay[] | undefined, iso: string): WeatherDay | null {
  if (!forecast) return null;
  return forecast.find((d) => d.data === iso) ?? null;
}

export function ObraTabCronograma({ obraId, etapas }: { obraId: string; etapas: Etapa[] }) {
  const { data: obra } = useObra(obraId);
  const endereco = obra?.endereco;

  const { data: clima } = useQuery<{ forecast: WeatherDay[] | null }>({
    queryKey: ["clima-obra", endereco],
    queryFn: async () => {
      const res = await fetch(
        `/api/clima?endereco=${encodeURIComponent(endereco!)}&data=${new Date()
          .toISOString()
          .slice(0, 10)}`
      );
      if (!res.ok) return { forecast: null };
      return res.json();
    },
    enabled: !!endereco,
  });

  const forecast = clima?.forecast ?? undefined;
  const hoje = new Date();
  const limite = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sorted = [...etapas].sort((a, b) => a.ordem - b.ordem);
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between p-4">
        <h3 className="font-display text-lg font-semibold">Cronograma</h3>
        <Link href={`/dashboard/etapas/nova?obraId=${obraId}`} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova etapa
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="table-verus">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th>Nome</th>
              <th>Prevista</th>
              <th>Realizada</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  Nenhuma etapa cadastrada.
                </td>
              </tr>
            )}
            {sorted.map((e) => {
              const prev = new Date(e.dataPrevista);
              const proximaSemana = prev >= hoje && prev <= limite;
              const w = proximaSemana
                ? pickDayLocal(forecast, prev.toISOString().slice(0, 10))
                : null;
              return (
              <tr key={e.id}>
                <td className="tabular-nums">{e.ordem}</td>
                <td className="font-medium">
                  <span className="inline-flex items-center gap-2">
                    {e.nome}
                    {w && <WeatherIcon weather={w} />}
                  </span>
                </td>
                <td>{formatDate(e.dataPrevista)}</td>
                <td>{e.dataRealizada ? formatDate(e.dataRealizada) : "—"}</td>
                <td>
                  <Badge tone={etapaStatusTone(e.status)}>{etapaStatusLabel(e.status)}</Badge>
                </td>
                <td className="text-right pr-4">
                  <Link href={`/dashboard/etapas/${e.id}`} className="text-brand text-sm hover:underline">
                    Ver
                  </Link>
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
