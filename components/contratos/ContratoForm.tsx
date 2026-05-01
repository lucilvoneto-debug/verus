"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contratoSchema, type ContratoInput } from "@/lib/validations/contrato";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useOrcamentosAprovados } from "@/hooks/useContratos";

export function ContratoForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
  lockOrcamento,
}: {
  defaultValues?: Partial<ContratoInput>;
  onSubmit: (data: ContratoInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  lockOrcamento?: boolean;
}) {
  const { data: orcamentos } = useOrcamentosAprovados();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContratoInput>({
    resolver: zodResolver(contratoSchema),
    defaultValues: {
      garantiaMeses: 60,
      ...defaultValues,
    },
  });

  const orcamentoId = watch("orcamentoId");

  // Quando seleciona um orçamento, preenche cliente e valor automaticamente
  useEffect(() => {
    if (!orcamentoId || !orcamentos?.data) return;
    const orc = orcamentos.data.find((o: { id: string }) => o.id === orcamentoId);
    if (orc) {
      setValue("clienteId", orc.clienteId);
      setValue("valor", orc.total);
      if (!watch("condicaoPagamento") && orc.condicaoPagamento) {
        setValue("condicaoPagamento", orc.condicaoPagamento);
      }
      if (!watch("prazoExecucao") && orc.prazoExecucao) {
        setValue("prazoExecucao", orc.prazoExecucao);
      }
    }
  }, [orcamentoId, orcamentos, setValue, watch]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Origem</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Orçamento aprovado
            </label>
            <select
              className="input-verus"
              disabled={lockOrcamento}
              {...register("orcamentoId")}
            >
              <option value="">Selecione...</option>
              {orcamentos?.data?.map(
                (o: {
                  id: string;
                  numero: string;
                  total: number;
                  cliente: { nome: string };
                }) => (
                  <option key={o.id} value={o.id}>
                    {o.numero} — {o.cliente?.nome} (R$ {o.total.toFixed(2)})
                  </option>
                )
              )}
            </select>
            {errors.orcamentoId && (
              <p className="text-xs text-danger">{errors.orcamentoId.message}</p>
            )}
          </div>
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            {...register("valor", { valueAsNumber: true })}
            error={errors.valor?.message}
          />
          <Input
            label="Condição de pagamento"
            {...register("condicaoPagamento")}
            error={errors.condicaoPagamento?.message}
          />
          <Input
            label="Prazo de execução"
            {...register("prazoExecucao")}
            error={errors.prazoExecucao?.message}
          />
          <Input
            label="Garantia (meses)"
            type="number"
            {...register("garantiaMeses", { valueAsNumber: true })}
            error={errors.garantiaMeses?.message}
          />
          <input type="hidden" {...register("clienteId")} />
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Cláusulas</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escopo</label>
            <textarea
              {...register("escopo")}
              rows={4}
              className="input-verus"
              placeholder="Descreva o escopo do serviço..."
            />
            {errors.escopo && (
              <p className="text-xs text-danger">{errors.escopo.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obrigações do cliente
            </label>
            <textarea
              {...register("obrigacoesCliente")}
              rows={3}
              className="input-verus"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Obrigações da empresa
            </label>
            <textarea
              {...register("obrigacoesEmpresa")}
              rows={3}
              className="input-verus"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cláusulas extras
            </label>
            <textarea
              {...register("clausulasExtras")}
              rows={3}
              className="input-verus"
            />
          </div>
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
