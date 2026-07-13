"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fabricanteSchema, type FabricanteInput } from "@/lib/validations/fabricante";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function FabricanteForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<FabricanteInput>;
  onSubmit: (data: FabricanteInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FabricanteInput>({
    resolver: zodResolver(fabricanteSchema),
    defaultValues: {
      ativo: true,
      catalogoSincronizado: false,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome" {...register("nome")} error={errors.nome?.message} />
          <Input
            label="Garantia padrão (anos)"
            type="number"
            step="1"
            {...register("garantiaAnosPadrao", { valueAsNumber: true })}
            error={errors.garantiaAnosPadrao?.message}
          />
          <Input
            label="Normas técnicas"
            {...register("normasTecnicas")}
            placeholder="ex.: NBR 9575/9574"
          />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <input type="checkbox" id="ativo" {...register("ativo")} />
          <label htmlFor="ativo" className="text-sm text-gray-700">
            Fabricante ativo
          </label>
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Catálogo e documentação</h3>
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="catalogoSincronizado" {...register("catalogoSincronizado")} />
          <label htmlFor="catalogoSincronizado" className="text-sm text-gray-700">
            Catálogo sincronizado
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Ficha técnica (URL)"
            {...register("fichaTecnicaUrl")}
            error={errors.fichaTecnicaUrl?.message}
          />
          <Input
            label="FISPQ (URL)"
            {...register("fispqUrl")}
            error={errors.fispqUrl?.message}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            className="input-verus"
            rows={3}
            {...register("observacoes")}
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
