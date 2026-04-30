"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PedidoCompraForm } from "@/components/compras/PedidoCompraForm";
import { useCreateCompra } from "@/hooks/useCompras";

export default function NovoPedidoPage() {
  const router = useRouter();
  const create = useCreateCompra();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compras" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo pedido de compra</h2>
          <p className="text-sm text-gray-500">Cadastre um novo pedido junto a um fornecedor.</p>
        </div>
      </div>

      <PedidoCompraForm
        submitting={create.isPending}
        submitLabel="Criar pedido"
        onSubmit={async (data) => {
          try {
            const p = await create.mutateAsync(data);
            router.push(`/dashboard/compras/${p.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}
