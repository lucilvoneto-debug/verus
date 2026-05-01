"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { movimentacaoSchema, type MovimentacaoInput } from "@/lib/validations/material";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type Obra = { id: string; numero: string; nome: string };

export function MovimentarModal({
  open,
  onClose,
  onSubmit,
  submitting,
  custoSugerido,
  unidade,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MovimentacaoInput) => void | Promise<void>;
  submitting?: boolean;
  custoSugerido?: number;
  unidade?: string;
}) {
  const [obras, setObras] = useState<Obra[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/obras/lite")
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((j) => setObras(j.data ?? []))
      .catch(() => setObras([]));
  }, [open]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MovimentacaoInput>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: { tipo: "ENTRADA", quantidade: 0, custoUnit: custoSugerido ?? 0 },
  });

  useEffect(() => {
    if (open) reset({ tipo: "ENTRADA", quantidade: 0, custoUnit: custoSugerido ?? 0 });
  }, [open, custoSugerido, reset]);

  const tipo = watch("tipo");

  return (
    <Modal open={open} onClose={onClose} title="Movimentar estoque">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select
          label="Tipo"
          {...register("tipo")}
          options={[
            { value: "ENTRADA", label: "Entrada" },
            { value: "SAIDA", label: "Saída" },
            { value: "AJUSTE", label: "Ajuste" },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Quantidade${unidade ? ` (${unidade})` : ""}`}
            type="number"
            step="0.01"
            {...register("quantidade", { valueAsNumber: true })}
            error={errors.quantidade?.message}
          />
          <Input
            label="Custo unitário (R$)"
            type="number"
            step="0.01"
            disabled={tipo === "AJUSTE"}
            {...register("custoUnit", { valueAsNumber: true })}
          />
        </div>
        {tipo === "SAIDA" && (
          <Select
            label="Obra (opcional)"
            {...register("obraId")}
            options={[
              { value: "", label: "(Sem obra)" },
              ...obras.map((o) => ({ value: o.id, label: `${o.numero} · ${o.nome}` })),
            ]}
          />
        )}
        <textarea
          {...register("observacao")}
          rows={3}
          className="input-verus"
          placeholder="Observação..."
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
