"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type FormData = {
  valorPago: number;
  formaPagamento: string;
  comprovanteUrl?: string;
  observacoes?: string;
};

export function PagamentoModal({
  open,
  onClose,
  onSubmit,
  submitting,
  saldo,
  title = "Registrar pagamento",
  acaoLabel = "Confirmar",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void | Promise<void>;
  submitting?: boolean;
  saldo: number;
  title?: string;
  acaoLabel?: string;
}) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { valorPago: saldo, formaPagamento: "PIX" },
  });

  useEffect(() => {
    if (open) reset({ valorPago: saldo, formaPagamento: "PIX" });
  }, [open, saldo, reset]);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Valor pago (R$)"
          type="number"
          step="0.01"
          {...register("valorPago", { valueAsNumber: true, required: true, min: 0.01 })}
          error={errors.valorPago && "Valor inválido"}
        />
        <Select
          label="Forma de pagamento"
          {...register("formaPagamento", { required: true })}
          options={[
            { value: "PIX", label: "PIX" },
            { value: "TED", label: "TED" },
            { value: "BOLETO", label: "Boleto" },
            { value: "DINHEIRO", label: "Dinheiro" },
            { value: "CARTAO", label: "Cartão" },
            { value: "CHEQUE", label: "Cheque" },
          ]}
        />
        <Input label="Comprovante (URL)" {...register("comprovanteUrl")} />
        <textarea {...register("observacoes")} rows={3} className="input-impermeia" placeholder="Observações..." />
        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Processando..." : acaoLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
