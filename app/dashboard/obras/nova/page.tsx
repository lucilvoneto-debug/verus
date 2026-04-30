"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ObraForm } from "@/components/obras/ObraForm";
import { useCreateObra } from "@/hooks/useObras";

export default function NovaObraPage() {
  const router = useRouter();
  const create = useCreateObra();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/obras" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Nova obra</h2>
          <p className="text-sm text-gray-500">Vincule um contrato assinado para iniciar a execução.</p>
        </div>
      </div>

      <ObraForm
        submitting={create.isPending}
        submitLabel="Criar obra"
        onSubmit={async (data) => {
          try {
            const o = await create.mutateAsync(data);
            router.push(`/dashboard/obras/${o.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
