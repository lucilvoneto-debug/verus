"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FabricanteForm } from "@/components/fabricantes/FabricanteForm";
import { useFabricante, useUpdateFabricante } from "@/hooks/useFabricantes";
import type { FabricanteInput } from "@/lib/validations/fabricante";

export default function EditarFabricantePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useFabricante(params.id);
  const update = useUpdateFabricante(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;

  const defaults: Partial<FabricanteInput> = {
    nome: data.nome,
    ativo: data.ativo,
    catalogoSincronizado: data.catalogoSincronizado,
    fichaTecnicaUrl: data.fichaTecnicaUrl ?? "",
    fispqUrl: data.fispqUrl ?? "",
    normasTecnicas: data.normasTecnicas ?? "",
    garantiaAnosPadrao: data.garantiaAnosPadrao ?? undefined,
    observacoes: data.observacoes ?? "",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/fabricantes/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Editar fabricante</h2>
          <p className="text-sm text-gray-500">{data.nome}</p>
        </div>
      </div>

      <FabricanteForm
        defaultValues={defaults}
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/fabricantes/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
