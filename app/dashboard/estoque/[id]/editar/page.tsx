"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MaterialForm } from "@/components/estoque/MaterialForm";
import { useMaterial, useUpdateMaterial } from "@/hooks/useMateriais";
import type { MaterialInput } from "@/lib/validations/material";

export default function EditarMaterialPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useMaterial(params.id);
  const update = useUpdateMaterial(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;

  const defaults: Partial<MaterialInput> = {
    nome: data.nome,
    categoria: data.categoria,
    unidade: data.unidade,
    custoMedio: data.custoMedio,
    estoqueAtual: data.estoqueAtual,
    estoqueMinimo: data.estoqueMinimo,
    fornecedorPadraoId: data.fornecedorPadraoId ?? "",
    ativo: data.ativo,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/estoque/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Editar material</h2>
          <p className="text-sm text-gray-500">{data.nome}</p>
        </div>
      </div>

      <MaterialForm
        defaultValues={defaults}
        edicao
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/estoque/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
