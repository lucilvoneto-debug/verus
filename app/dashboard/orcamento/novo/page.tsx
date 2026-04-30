"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrcamentoEditor } from "@/components/orcamento/OrcamentoEditor";
import { useCreateOrcamento } from "@/hooks/useOrcamentos";

export default function NovoOrcamentoPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const create = useCreateOrcamento();

  const visitaId = sp.get("visitaId") ?? undefined;
  const clienteId = sp.get("clienteId") ?? undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orcamento" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo orçamento</h2>
          <p className="text-sm text-gray-500">
            Numeração automática · cálculos no servidor.
          </p>
        </div>
      </div>

      <OrcamentoEditor
        defaultValues={{
          clienteId,
          visitaId,
          itens: [],
          desconto: 0,
        }}
        submitting={create.isPending}
        onSubmit={async (data) => {
          try {
            const o = await create.mutateAsync(data);
            router.push(`/dashboard/orcamento/${o.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
