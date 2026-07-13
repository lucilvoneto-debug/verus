"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FabricanteForm } from "@/components/fabricantes/FabricanteForm";
import { useCreateFabricante } from "@/hooks/useFabricantes";

export default function NovoFabricantePage() {
  const router = useRouter();
  const create = useCreateFabricante();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/fabricantes" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo fabricante</h2>
          <p className="text-sm text-gray-500">Cadastre uma nova marca de produtos.</p>
        </div>
      </div>

      <FabricanteForm
        submitting={create.isPending}
        submitLabel="Criar fabricante"
        onSubmit={async (data) => {
          try {
            const f = await create.mutateAsync(data);
            router.push(`/dashboard/fabricantes/${f.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
