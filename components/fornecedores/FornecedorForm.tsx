"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fornecedorSchema, type FornecedorInput } from "@/lib/validations/fornecedor";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function FornecedorForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<FornecedorInput>;
  onSubmit: (data: FornecedorInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FornecedorInput>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: { ativo: true, ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nome / Razão social" {...register("nome")} error={errors.nome?.message} />
          <Input label="CNPJ" {...register("cnpj")} error={errors.cnpj?.message} />
          <Input label="Contato" {...register("contato")} />
          <Input label="E-mail" type="email" {...register("email")} error={errors.email?.message} />
          <Input label="Telefone" {...register("telefone")} />
          <Input label="Endereço" {...register("endereco")} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <input type="checkbox" id="ativo" {...register("ativo")} />
          <label htmlFor="ativo" className="text-sm text-gray-700">Fornecedor ativo</label>
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Observações</h3>
        <textarea
          {...register("observacoes")}
          rows={4}
          className="input-impermeia"
          placeholder="Notas internas..."
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
