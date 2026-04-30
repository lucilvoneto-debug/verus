"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visitaSchema, type VisitaInput } from "@/lib/validations/visita";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useColaboradores, useClientesSelect } from "@/hooks/useVisitas";

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
    formState: { errors },
  } = useForm<VisitaInput>({
    resolver: zodResolver(visitaSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Agendamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <select className="input-impermeia" {...register("clienteId")}>
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
            <select className="input-impermeia" {...register("tecnicoId")}>
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
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            {...register("observacoes")}
            rows={3}
            className="input-impermeia"
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
