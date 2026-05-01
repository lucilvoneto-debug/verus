"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clienteSchema, type ClienteInput } from "@/lib/validations/cliente";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

const categoriaOpts = [
  { value: "RESIDENCIAL", label: "Residencial" },
  { value: "CONDOMINIO", label: "Condomínio" },
  { value: "CONSTRUTORA", label: "Construtora" },
  { value: "EMPRESA", label: "Empresa" },
  { value: "INDUSTRIA", label: "Indústria" },
];

const tipoOpts = [
  { value: "PF", label: "Pessoa Física" },
  { value: "PJ", label: "Pessoa Jurídica" },
];

export function ClienteForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<ClienteInput>;
  onSubmit: (data: ClienteInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo: "PF",
      categoria: "RESIDENCIAL",
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Tipo" options={tipoOpts} {...register("tipo")} />
          <Select label="Categoria" options={categoriaOpts} {...register("categoria")} />
          <Input label="Nome / Razão social" {...register("nome")} error={errors.nome?.message} />
          <Input label="CPF / CNPJ" {...register("documento")} error={errors.documento?.message} />
          <Input label="E-mail" type="email" {...register("email")} error={errors.email?.message} />
          <Input label="Telefone" {...register("telefone")} />
          <Input label="WhatsApp" {...register("whatsapp")} />
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="CEP" {...register("cep")} />
          <Input label="Logradouro" {...register("logradouro")} className="md:col-span-2" />
          <Input label="Número" {...register("numero")} />
          <Input label="Complemento" {...register("complemento")} />
          <Input label="Bairro" {...register("bairro")} />
          <Input label="Cidade" {...register("cidade")} />
          <Input label="UF" maxLength={2} {...register("uf")} />
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Observações</h3>
        <textarea
          {...register("observacoes")}
          rows={4}
          className="input-verus"
          placeholder="Notas internas sobre o cliente..."
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
