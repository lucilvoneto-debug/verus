"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";
import { useCreateFornecedor } from "@/hooks/useFornecedores";

export default function NovoFornecedorPage() {
  const router = useRouter();
  const create = useCreateFornecedor();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/fornecedores" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo fornecedor</h2>
          <p className="text-sm text-gray-500">Cadastre um novo fornecedor.</p>
        </div>
      </div>

      <FornecedorForm
        submitting={create.isPending}
        submitLabel="Criar fornecedor"
        onSubmit={async (data) => {
          try {
            const f = await create.mutateAsync(data);
            router.push(`/dashboard/fornecedores/${f.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
