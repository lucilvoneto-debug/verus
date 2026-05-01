"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
