"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EtapaForm } from "@/components/etapas/EtapaForm";
import { useCreateEtapa } from "@/hooks/useEtapas";

export default function NovaEtapaPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const obraId = sp.get("obraId") ?? "";
  const create = useCreateEtapa();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/etapas" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Nova etapa</h2>
          <p className="text-sm text-gray-500">Cadastre uma etapa de obra.</p>
        </div>
      </div>

      <EtapaForm
        defaultValues={{ obraId }}
        submitting={create.isPending}
        submitLabel="Criar etapa"
        onSubmit={async (data) => {
          try {
            const e = await create.mutateAsync(data);
            router.push(`/dashboard/etapas/${e.id}`);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Erro");
          }
        }}
      />
    </div>
  );
}
