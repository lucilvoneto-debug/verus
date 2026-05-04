"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { visitaSchema, type VisitaInput } from "@/lib/validations/visita";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useColaboradores, useClientesSelect } from "@/hooks/useVisitas";
import { WeatherIcon, condicaoLabel, isChuva } from "@/lib/weather-icons";
import type { WeatherDay } from "@/lib/weather";

export function VisitaForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<VisitaInput>;
  onSubmit: (data: VisitaInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const { data: clientes } = useClientesSelect();
  const { data: tecnicos } = useColaboradores(["TECNICO", "ENGENHEIRO"]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<VisitaInput>({
    resolver: zodResolver(visitaSchema),
    defaultValues,
  });

  const dataAgendada = useWatch({ control, name: "dataAgendada" });
  const endereco = useWatch({ control, name: "endereco" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Agendamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <select className="input-verus" {...register("clienteId")}>
              <option value="">Selecione...</option>
              {clientes?.data?.map((c: { id: string; nome: string }) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
            {errors.clienteId && (
              <p className="text-xs text-danger">{errors.clienteId.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Técnico</label>
            <select className="input-verus" {...register("tecnicoId")}>
              <option value="">Selecione...</option>
              {tecnicos?.data?.map(
                (c: { id: string; nome: string; userId: string | null; funcao: string }) =>
                  c.userId && (
                    <option key={c.id} value={c.userId}>
                      {c.nome} ({c.funcao})
                    </option>
                  )
              )}
            </select>
            {errors.tecnicoId && (
              <p className="text-xs text-danger">{errors.tecnicoId.message}</p>
            )}
          </div>
          <Input
            label="Data e hora agendada"
            type="datetime-local"
            {...register("dataAgendada")}
            error={errors.dataAgendada?.message}
          />
          <Input
            label="Endereço"
            {...register("endereco")}
            error={errors.endereco?.message}
            className="md:col-span-2"
          />
          <div className="md:col-span-2">
            <PrevisaoChuva endereco={endereco} dataAgendada={dataAgendada} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            {...register("observacoes")}
            rows={3}
            className="input-verus"
            placeholder="Notas para o técnico..."
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function PrevisaoChuva({
  endereco,
  dataAgendada,
}: {
  endereco?: string;
  dataAgendada?: string;
}) {
  const dataISO = dataAgendada ? dataAgendada.slice(0, 10) : "";
  const hoje = new Date();
  const limite = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dt = dataISO ? new Date(dataISO + "T12:00:00") : null;
  const dentroJanela = dt && dt >= new Date(hoje.toDateString()) && dt <= limite;

  const enabled = !!(endereco && endereco.length > 4 && dentroJanela);

  const { data } = useQuery<{ weather: WeatherDay | null; cidade: string | null }>({
    queryKey: ["clima-form", endereco, dataISO],
    queryFn: async () => {
      const res = await fetch(
        `/api/clima?endereco=${encodeURIComponent(endereco!)}&data=${dataISO}`
      );
      if (!res.ok) return { weather: null, cidade: null };
      return res.json();
    },
    enabled,
  });

  if (!enabled) return null;
  const w = data?.weather;
  if (!w) return null;
  if (!isChuva(w.condicao)) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
      <WeatherIcon weather={w} />
      <div className="flex-1">
        <div className="font-medium text-amber-900">
          Previsão para essa data: {condicaoLabel[w.condicao]}
        </div>
        <div className="text-xs text-amber-800">
          {Math.round(w.tempMin)}°/{Math.round(w.tempMax)}° · {w.probChuva}% chuva (
          {w.chuvaMm.toFixed(1)} mm){data?.cidade ? ` · ${data.cidade}` : ""}
        </div>
      </div>
    </div>
  );
}
