"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrcamentoEditor } from "@/components/orcamento/OrcamentoEditor";
import { useOrcamento, useUpdateOrcamento } from "@/hooks/useOrcamentos";

export default function EditarOrcamentoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useOrcamento(params.id);
  const update = useUpdateOrcamento(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;

  const validade = new Date(data.dataValidade).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/orcamento/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            Editar {data.numero}
          </h2>
          <p className="text-sm text-gray-500">{data.cliente?.nome}</p>
        </div>
      </div>

      <OrcamentoEditor
        isEdit
        defaultValues={{
          clienteId: data.clienteId,
          visitaId: data.visitaId ?? "",
          vendedorId: data.vendedorId,
          dataValidade: validade,
          desconto: data.desconto,
          condicaoPagamento: data.condicaoPagamento ?? "",
          prazoExecucao: data.prazoExecucao ?? "",
          observacoes: data.observacoes ?? "",
          itens: data.itens.map(
            (it: {
              servicoId: string;
              descricao: string;
              area: number | null;
              quantidade: number;
              unidade: string;
              custoUnit: number;
              precoUnit: number;
              subtotal: number;
            }) => ({
              servicoId: it.servicoId,
              descricao: it.descricao,
              area: it.area,
              quantidade: it.quantidade,
              unidade: it.unidade,
              custoUnit: it.custoUnit,
              precoUnit: it.precoUnit,
              subtotal: it.subtotal,
            })
          ),
        }}
        submitting={update.isPending}
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/orcamento/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
