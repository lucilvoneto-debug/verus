"use client";

import { Suspense } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MedicaoForm } from "@/components/medicoes/MedicaoForm";
import { useCreateMedicao } from "@/hooks/useMedicoes";

function NovaMedicaoPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const obraId = sp.get("obraId") ?? "";
  const create = useCreateMedicao();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/medicoes" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Nova medição</h2>
          <p className="text-sm text-gray-500">Boletim de medição mensal por obra.</p>
        </div>
      </div>

      <MedicaoForm
        defaultValues={{ obraId }}
        submitting={create.isPending}
        submitLabel="Criar medição"
        onSubmit={async (data) => {
          try {
            const m = await create.mutateAsync(data);
            router.push(`/dashboard/medicoes/${m.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="p-6 text-sm text-gray-500">Carregando...</div>}><NovaMedicaoPageInner /></Suspense>; }
