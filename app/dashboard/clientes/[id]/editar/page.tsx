"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { useCliente, useUpdateCliente } from "@/hooks/useClientes";
import type { ClienteInput } from "@/lib/validations/cliente";

export default function EditarClientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useCliente(params.id);
  const update = useUpdateCliente(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;

  const defaults: Partial<ClienteInput> = {
    tipo: data.tipo,
    nome: data.nome,
    documento: data.documento,
    email: data.email ?? "",
    telefone: data.telefone ?? "",
    whatsapp: data.whatsapp ?? "",
    cep: data.cep ?? "",
    logradouro: data.logradouro ?? "",
    numero: data.numero ?? "",
    complemento: data.complemento ?? "",
    bairro: data.bairro ?? "",
    cidade: data.cidade ?? "",
    uf: data.uf ?? "",
    categoria: data.categoria,
    observacoes: data.observacoes ?? "",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/clientes/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Editar cliente</h2>
          <p className="text-sm text-gray-500">{data.nome}</p>
        </div>
      </div>

      <ClienteForm
        defaultValues={defaults}
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/clientes/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
