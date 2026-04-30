"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MaterialForm } from "@/components/estoque/MaterialForm";
import { useCreateMaterial } from "@/hooks/useMateriais";

export default function NovoMaterialPage() {
  const router = useRouter();
  const create = useCreateMaterial();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/estoque" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo material</h2>
          <p className="text-sm text-gray-500">Cadastre um novo material no estoque.</p>
        </div>
      </div>

      <MaterialForm
        submitting={create.isPending}
        submitLabel="Criar material"
        onSubmit={async (data) => {
          try {
            const m = await create.mutateAsync(data);
            router.push(`/dashboard/estoque/${m.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
