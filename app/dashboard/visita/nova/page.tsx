"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { VisitaForm } from "@/components/visita/VisitaForm";
import { useCreateVisita } from "@/hooks/useVisitas";

export default function NovaVisitaPage() {
  const router = useRouter();
  const create = useCreateVisita();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/visita" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Nova visita</h2>
          <p className="text-sm text-gray-500">Agende uma nova visita técnica.</p>
        </div>
      </div>

      <VisitaForm
        submitting={create.isPending}
        submitLabel="Agendar visita"
        onSubmit={async (data) => {
          try {
            const v = await create.mutateAsync(data);
            router.push(`/dashboard/visita/${v.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
