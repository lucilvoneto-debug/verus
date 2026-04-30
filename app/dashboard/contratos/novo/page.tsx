"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ContratoForm } from "@/components/contratos/ContratoForm";
import { useCreateContrato } from "@/hooks/useContratos";

export default function NovoContratoPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const create = useCreateContrato();

  const orcamentoId = sp.get("orcamentoId") ?? undefined;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/contratos" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo contrato</h2>
          <p className="text-sm text-gray-500">
            Numeração automática · vinculado a um orçamento aprovado.
          </p>
        </div>
      </div>

      <ContratoForm
        defaultValues={{ orcamentoId }}
        lockOrcamento={!!orcamentoId}
        submitting={create.isPending}
        submitLabel="Criar contrato"
        onSubmit={async (data) => {
          try {
            const c = await create.mutateAsync(data);
            router.push(`/dashboard/contratos/${c.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
