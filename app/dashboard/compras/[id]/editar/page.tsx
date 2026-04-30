"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PedidoCompraForm } from "@/components/compras/PedidoCompraForm";
import { useCompra, useUpdateCompra } from "@/hooks/useCompras";
import type { PedidoCompraInput } from "@/lib/validations/pedidoCompra";

type Item = {
  materialId: string;
  quantidade: number;
  custoUnit: number;
  subtotal: number;
};

export default function EditarPedidoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useCompra(params.id);
  const update = useUpdateCompra(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;
  if (data.status !== "RASCUNHO") {
    return <div className="text-gray-500">Apenas pedidos em RASCUNHO podem ser editados.</div>;
  }

  const defaults: Partial<PedidoCompraInput> = {
    fornecedorId: data.fornecedorId,
    dataPedido: data.dataPedido.slice(0, 10),
    dataPrevista: data.dataPrevista.slice(0, 10),
    observacoes: data.observacoes ?? "",
    itens: data.itens.map((i: Item) => ({
      materialId: i.materialId,
      quantidade: i.quantidade,
      custoUnit: i.custoUnit,
      subtotal: i.subtotal,
    })),
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/compras/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Editar pedido</h2>
          <p className="text-sm text-gray-500">{data.numero}</p>
        </div>
      </div>

      <PedidoCompraForm
        defaultValues={defaults}
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/compras/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
