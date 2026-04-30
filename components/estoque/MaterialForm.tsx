"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { materialSchema, type MaterialInput } from "@/lib/validations/material";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Fornecedor = { id: string; nome: string };

export function MaterialForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
  edicao,
}: {
  defaultValues?: Partial<MaterialInput>;
  onSubmit: (data: MaterialInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  edicao?: boolean;
}) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    fetch("/api/fornecedores?pageSize=200&ativo=true")
      .then((r) => r.json())
      .then((j) => setFornecedores(j.data ?? []))
      .catch(() => setFornecedores([]));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialInput>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      unidade: "UN",
      categoria: "GERAL",
      custoMedio: 0,
      estoqueAtual: 0,
      estoqueMinimo: 0,
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
          <Input label="Categoria" {...register("categoria")} error={errors.categoria?.message} />
          <Input label="Unidade" {...register("unidade")} error={errors.unidade?.message} placeholder="UN, KG, L, M..." />
          <Select
            label="Fornecedor padrão"
            {...register("fornecedorPadraoId")}
            options={[
              { value: "", label: "(Nenhum)" },
              ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
            ]}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Estoque</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Custo médio (R$)"
            type="number"
            step="0.01"
            {...register("custoMedio", { valueAsNumber: true })}
          />
          <Input
            label="Estoque atual"
            type="number"
            step="0.01"
            disabled={edicao}
            {...register("estoqueAtual", { valueAsNumber: true })}
          />
          <Input
            label="Estoque mínimo"
            type="number"
            step="0.01"
            {...register("estoqueMinimo", { valueAsNumber: true })}
          />
        </div>
        {edicao && (
          <p className="text-xs text-gray-500 mt-3">
            O estoque atual só pode ser alterado por movimentações.
          </p>
        )}
        <div className="flex items-center gap-2 mt-4">
          <input type="checkbox" id="ativo" {...register("ativo")} />
          <label htmlFor="ativo" className="text-sm text-gray-700">
            Material ativo
          </label>
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
