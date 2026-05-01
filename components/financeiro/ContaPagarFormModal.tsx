"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contaPagarSchema, type ContaPagarInput } from "@/lib/validations/contaPagar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Fornecedor = { id: string; nome: string };

export function ContaPagarFormModal({
  open,
  onClose,
  onSubmit,
  submitting,
  defaultValues,
  title = "Nova conta a pagar",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContaPagarInput) => void | Promise<void>;
  submitting?: boolean;
  defaultValues?: Partial<ContaPagarInput>;
  title?: string;
}) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/fornecedores?pageSize=100&ativo=true")
      .then((r) => r.json())
      .then((j) => setFornecedores(j.data ?? []))
      .catch(() => setFornecedores([]));
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContaPagarInput>({
    resolver: zodResolver(contaPagarSchema),
    defaultValues: { status: "ABERTA", valor: 0, categoria: "GERAL", ...defaultValues },
  });

  useEffect(() => {
    if (open) reset({ status: "ABERTA", valor: 0, categoria: "GERAL", ...defaultValues });
  }, [open, defaultValues, reset]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Fornecedor"
          {...register("fornecedorId")}
          options={[
            { value: "", label: "(Sem fornecedor)" },
            ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
          ]}
        />
        <Input label="Categoria" {...register("categoria")} error={errors.categoria?.message} />
        <Input label="Descrição" {...register("descricao")} error={errors.descricao?.message} />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            {...register("valor", { valueAsNumber: true })}
            error={errors.valor?.message}
          />
          <Input label="Vencimento" type="date" {...register("vencimento")} error={errors.vencimento?.message} />
        </div>
        <Select
          label="Status"
          {...register("status")}
          options={[
            { value: "ABERTA", label: "Aberta" },
            { value: "PAGA", label: "Paga" },
            { value: "PARCIAL", label: "Parcial" },
          ]}
        />
        <textarea {...register("observacoes")} rows={3} className="input-verus" placeholder="Observações..." />
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
