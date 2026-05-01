"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contaReceberSchema, type ContaReceberInput } from "@/lib/validations/contaReceber";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Cliente = { id: string; nome: string };

export function ContaReceberFormModal({
  open,
  onClose,
  onSubmit,
  submitting,
  defaultValues,
  title = "Nova conta a receber",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ContaReceberInput) => void | Promise<void>;
  submitting?: boolean;
  defaultValues?: Partial<ContaReceberInput>;
  title?: string;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/clientes?pageSize=100")
      .then((r) => r.json())
      .then((j) => setClientes(j.data ?? []))
      .catch(() => setClientes([]));
  }, [open]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContaReceberInput>({
    resolver: zodResolver(contaReceberSchema),
    defaultValues: { status: "ABERTA", valor: 0, ...defaultValues },
  });

  useEffect(() => {
    if (open) reset({ status: "ABERTA", valor: 0, ...defaultValues });
  }, [open, defaultValues, reset]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Cliente"
          {...register("clienteId")}
          options={[{ value: "", label: "Selecione..." }, ...clientes.map((c) => ({ value: c.id, label: c.nome }))]}
        />
        {errors.clienteId && <p className="text-xs text-danger">{errors.clienteId.message}</p>}
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
