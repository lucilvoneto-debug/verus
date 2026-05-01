"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicaoSchema, type MedicaoInput } from "@/lib/validations/medicao";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { useObrasLite } from "@/hooks/useObras";
import { formatCurrency } from "@/lib/utils";

export function MedicaoForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<MedicaoInput>;
  onSubmit: (data: MedicaoInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const obrasQ = useObrasLite();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MedicaoInput>({
    resolver: zodResolver(medicaoSchema),
    defaultValues: {
      percentualExecutado: 0,
      valor: 0,
      ...defaultValues,
    },
  });

  const obraIdSel = watch("obraId");
  const percent = watch("percentualExecutado");
  const obraSel = useMemo(
    () => obrasQ.data?.data.find((o) => o.id === obraIdSel),
    [obraIdSel, obrasQ.data]
  );
  const valorContrato = obraSel?.contrato?.valor ?? 0;

  // Sugere valor calculado baseado em percentual * valorContrato (se valor estiver zerado)
  useEffect(() => {
    const current = watch("valor");
    if (valorContrato > 0 && (!current || current === 0)) {
      setValue("valor", Number(((Number(percent) || 0) / 100 * valorContrato).toFixed(2)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorContrato]);

  const obraOpts = useMemo(() => {
    const opts =
      obrasQ.data?.data.map((o) => ({
        value: o.id,
        label: `${o.numero} · ${o.nome}`,
      })) ?? [];
    return [{ value: "", label: "Selecione..." }, ...opts];
  }, [obrasQ.data]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Obra" options={obraOpts} {...register("obraId")} error={errors.obraId?.message} />
          <Input
            label="Data de referência"
            type="date"
            {...register("dataReferencia")}
            error={errors.dataReferencia?.message}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Percentual executado: {(Number(percent) || 0).toFixed(1)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={Number(percent) || 0}
              onChange={(e) => setValue("percentualExecutado", Number(e.target.value))}
              className="w-full accent-brand"
            />
            <input
              type="number"
              step={0.1}
              min={0}
              max={100}
              {...register("percentualExecutado", { valueAsNumber: true })}
              className="input-verus"
            />
            {errors.percentualExecutado && (
              <p className="text-xs text-danger">{errors.percentualExecutado.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              min={0}
              {...register("valor", { valueAsNumber: true })}
              error={errors.valor?.message}
            />
            {valorContrato > 0 && (
              <p className="text-xs text-gray-500">
                Contrato: {formatCurrency(valorContrato)} · sugestão (% × contrato):{" "}
                {formatCurrency(((Number(percent) || 0) / 100) * valorContrato)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <label className="block text-sm font-medium text-gray-700">Observações</label>
          <textarea {...register("observacoes")} rows={3} className="input-verus" />
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
