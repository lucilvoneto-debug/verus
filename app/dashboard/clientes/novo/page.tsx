"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { useCreateCliente } from "@/hooks/useClientes";

export default function NovoClientePage() {
  const router = useRouter();
  const create = useCreateCliente();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/clientes" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo cliente</h2>
          <p className="text-sm text-gray-500">Cadastre um novo cliente PF ou PJ.</p>
        </div>
      </div>

      <ClienteForm
        submitting={create.isPending}
        submitLabel="Criar cliente"
        onSubmit={async (data) => {
          try {
            const c = await create.mutateAsync(data);
            router.push(`/dashboard/clientes/${c.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
