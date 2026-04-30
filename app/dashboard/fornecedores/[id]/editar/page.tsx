"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";
import { useFornecedor, useUpdateFornecedor } from "@/hooks/useFornecedores";
import type { FornecedorInput } from "@/lib/validations/fornecedor";

export default function EditarFornecedorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useFornecedor(params.id);
  const update = useUpdateFornecedor(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;

  const defaults: Partial<FornecedorInput> = {
    nome: data.nome,
    cnpj: data.cnpj,
    contato: data.contato ?? "",
    email: data.email ?? "",
    telefone: data.telefone ?? "",
    endereco: data.endereco ?? "",
    observacoes: data.observacoes ?? "",
    ativo: data.ativo,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/fornecedores/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Editar fornecedor</h2>
          <p className="text-sm text-gray-500">{data.nome}</p>
        </div>
      </div>

      <FornecedorForm
        defaultValues={defaults}
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/fornecedores/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
