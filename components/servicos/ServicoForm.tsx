"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, ChevronUp } from "lucide-react";
import { servicoSchema, type ServicoInput } from "@/lib/validations/servico";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

const unidadeOpts = [
  { value: "M2", label: "m²" },
  { value: "METRO_LINEAR", label: "Metro linear" },
  { value: "DIARIA", label: "Diária" },
  { value: "UNIDADE", label: "Unidade" },
];

/** Campos que o form guarda como fração (0-1) mas exibe como "%" (0-100). */
const PERCENT_FIELDS = [
  "percaPercent",
  "bdiPercent",
  "impostosPercent",
  "lucroPercent",
] as const;
type PercentField = (typeof PERCENT_FIELDS)[number];

function fracaoParaPercentDisplay(v: number | null | undefined): string {
  if (v == null) return "";
  return String(Math.round(v * 100 * 100) / 100);
}

export function ServicoForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<ServicoInput>;
  onSubmit: (data: ServicoInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ServicoInput>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      unidade: "M2",
      custoPadrao: 0,
      precoPadrao: 0,
      ativo: true,
      ...defaultValues,
    },
  });

  const [custosAberto, setCustosAberto] = useState(() =>
    Boolean(
      (defaultValues && PERCENT_FIELDS.some((f) => defaultValues[f] != null)) ||
        defaultValues?.maoDeObraPorUnidade != null ||
        defaultValues?.equipamentosPorUnidade != null ||
        defaultValues?.episTransportePorUnidade != null
    )
  );

  const [percentDisplay, setPercentDisplay] = useState<Record<PercentField, string>>(() => ({
    percaPercent: fracaoParaPercentDisplay(defaultValues?.percaPercent),
    bdiPercent: fracaoParaPercentDisplay(defaultValues?.bdiPercent),
    impostosPercent: fracaoParaPercentDisplay(defaultValues?.impostosPercent),
    lucroPercent: fracaoParaPercentDisplay(defaultValues?.lucroPercent),
  }));

  function handlePercentChange(field: PercentField, raw: string) {
    setPercentDisplay((prev) => ({ ...prev, [field]: raw }));
    const n = raw.trim() === "" ? null : Number(raw);
    setValue(field, n == null || Number.isNaN(n) ? null : n / 100, { shouldValidate: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome" {...register("nome")} error={errors.nome?.message} />
          <Select label="Unidade" options={unidadeOpts} {...register("unidade")} />
          <Input
            label="Custo padrão (R$)"
            type="number"
            step="0.01"
            {...register("custoPadrao", { valueAsNumber: true })}
            error={errors.custoPadrao?.message}
          />
          <Input
            label="Preço padrão (R$)"
            type="number"
            step="0.01"
            {...register("precoPadrao", { valueAsNumber: true })}
            error={errors.precoPadrao?.message}
          />
          <Input
            label="Tempo médio (h/unid)"
            type="number"
            step="0.1"
            {...register("tempoMedio", { valueAsNumber: true })}
          />
          <div className="flex items-center gap-2 pt-7">
            <input type="checkbox" id="ativo" {...register("ativo")} />
            <label htmlFor="ativo" className="text-sm text-gray-700">
              Serviço ativo
            </label>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Custo e preço padrão podem ser digitados aqui ou gerados automaticamente pelo motor de
          orçamento a partir dos materiais vinculados (aba &ldquo;Materiais&rdquo; do serviço, botão
          &ldquo;Recalcular a partir dos materiais&rdquo;).
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            {...register("descricao")}
            rows={3}
            className="input-verus"
            placeholder="Descrição comercial do serviço..."
          />
        </div>
      </Card>

      <Card>
        <button
          type="button"
          onClick={() => setCustosAberto((v) => !v)}
          className="flex items-center justify-between w-full"
        >
          <div className="text-left">
            <h3 className="font-display text-lg font-semibold">Custos e margem</h3>
            <p className="text-xs text-gray-500">
              Taxas usadas pelo motor de orçamento para calcular custoPadrao/precoPadrao a partir
              dos materiais vinculados.
            </p>
          </div>
          {custosAberto ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {custosAberto && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Input
              label="Perdas/sobreposição (%)"
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={percentDisplay.percaPercent}
              onChange={(e) => handlePercentChange("percaPercent", e.target.value)}
              error={errors.percaPercent?.message}
            />
            <Input
              label="Mão de obra (R$/unidade)"
              type="number"
              step="0.01"
              {...register("maoDeObraPorUnidade", { valueAsNumber: true })}
              error={errors.maoDeObraPorUnidade?.message}
            />
            <Input
              label="Equipamentos (R$/unidade)"
              type="number"
              step="0.01"
              {...register("equipamentosPorUnidade", { valueAsNumber: true })}
              error={errors.equipamentosPorUnidade?.message}
            />
            <Input
              label="EPI/transporte (R$/unidade)"
              type="number"
              step="0.01"
              {...register("episTransportePorUnidade", { valueAsNumber: true })}
              error={errors.episTransportePorUnidade?.message}
            />
            <Input
              label="BDI (%)"
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={percentDisplay.bdiPercent}
              onChange={(e) => handlePercentChange("bdiPercent", e.target.value)}
              error={errors.bdiPercent?.message}
            />
            <Input
              label="Impostos (%)"
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={percentDisplay.impostosPercent}
              onChange={(e) => handlePercentChange("impostosPercent", e.target.value)}
              error={errors.impostosPercent?.message}
            />
            <Input
              label="Lucro (%)"
              type="number"
              step="0.1"
              min={0}
              max={100}
              value={percentDisplay.lucroPercent}
              onChange={(e) => handlePercentChange("lucroPercent", e.target.value)}
              error={errors.lucroPercent?.message}
            />
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Observações técnicas</h3>
        <textarea
          {...register("observacoesTecnicas")}
          rows={4}
          className="input-verus"
          placeholder="Cuidados, recomendações, normas técnicas..."
        />
      </Card>

      <div className="flex items-center justify-end gap-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
