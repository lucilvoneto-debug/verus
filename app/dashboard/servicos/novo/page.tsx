"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ServicoForm } from "@/components/servicos/ServicoForm";
import { useCreateServico } from "@/hooks/useServicos";

export default function NovoServicoPage() {
  const router = useRouter();
  const create = useCreateServico();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/servicos" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo serviço</h2>
          <p className="text-sm text-gray-500">Cadastre um novo serviço no catálogo.</p>
        </div>
      </div>

      <ServicoForm
        submitting={create.isPending}
        submitLabel="Criar serviço"
        onSubmit={async (data) => {
          try {
            const s = await create.mutateAsync(data);
            router.push(`/dashboard/servicos/${s.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
