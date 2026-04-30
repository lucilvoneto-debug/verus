"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { obraSchema, type ObraInput } from "@/lib/validations/obra";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import {
  useContratosDisponiveis,
  useColaboradoresPorFuncao,
} from "@/hooks/useObras";
import { formatCurrency } from "@/lib/utils";

const statusOpts = [
  { value: "AGUARDANDO", label: "Aguardando" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "PAUSADA", label: "Pausada" },
  { value: "ATRASADA", label: "Atrasada" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

export function ObraForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
  isEdit = false,
}: {
  defaultValues?: Partial<ObraInput>;
  onSubmit: (data: ObraInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  isEdit?: boolean;
}) {
  const contratosQ = useContratosDisponiveis();
  const colabsQ = useColaboradoresPorFuncao(["SUPERVISOR", "ENGENHEIRO"]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ObraInput>({
    resolver: zodResolver(obraSchema),
    defaultValues: {
      status: "AGUARDANDO",
      ...defaultValues,
    },
  });

  const contratoIdSel = watch("contratoId");
  const contratoSelecionado = useMemo(
    () => contratosQ.data?.data.find((c) => c.id === contratoIdSel),
    [contratoIdSel, contratosQ.data]
  );

  // Auto-preenche cliente quando seleciona contrato
  useEffect(() => {
    if (contratoSelecionado && !isEdit) {
      setValue("clienteId", contratoSelecionado.clienteId);
    }
  }, [contratoSelecionado, setValue, isEdit]);

  const contratoOpts = useMemo(() => {
    const base = contratosQ.data?.data.map((c) => ({
      value: c.id,
      label: `${c.numero} · ${c.cliente.nome} · ${formatCurrency(c.valor)}`,
    })) ?? [];
    if (isEdit && defaultValues?.contratoId && !base.find((o) => o.value === defaultValues.contratoId)) {
      base.unshift({ value: defaultValues.contratoId, label: "(contrato atual)" });
    }
    return [{ value: "", label: "Selecione..." }, ...base];
  }, [contratosQ.data, isEdit, defaultValues?.contratoId]);

  const responsavelOpts = useMemo(() => {
    const opts =
      colabsQ.data?.data
        .filter((c) => c.userId)
        .map((c) => ({ value: c.userId as string, label: `${c.nome} · ${c.funcao}` })) ?? [];
    return [{ value: "", label: "Selecione..." }, ...opts];
  }, [colabsQ.data]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Contrato"
            options={contratoOpts}
            {...register("contratoId")}
            error={errors.contratoId?.message}
          />
          <Input
            label="Cliente (auto)"
            value={contratoSelecionado?.cliente.nome ?? ""}
            readOnly
            placeholder="Selecione um contrato"
          />
          <input type="hidden" {...register("clienteId")} />
          <Input label="Nome da obra" {...register("nome")} error={errors.nome?.message} />
          <Input label="Endereço" {...register("endereco")} error={errors.endereco?.message} />
          <Select
            label="Responsável (Supervisor/Engenheiro)"
            options={responsavelOpts}
            {...register("responsavelId")}
            error={errors.responsavelId?.message}
          />
          <Select label="Status" options={statusOpts} {...register("status")} />
          <Input
            label="Data de início"
            type="date"
            {...register("dataInicio")}
            error={errors.dataInicio?.message}
          />
          <Input
            label="Previsão de término"
            type="date"
            {...register("previsaoTermino")}
            error={errors.previsaoTermino?.message}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Observações</h3>
        <textarea
          {...register("observacoes")}
          rows={4}
          className="input-impermeia"
          placeholder="Notas sobre a obra..."
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
