"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ContratoForm } from "@/components/contratos/ContratoForm";
import { useContrato, useUpdateContrato } from "@/hooks/useContratos";
import type { ContratoInput } from "@/lib/validations/contrato";

export default function EditarContratoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useContrato(params.id);
  const update = useUpdateContrato(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;

  const defaults: Partial<ContratoInput> = {
    orcamentoId: data.orcamentoId,
    clienteId: data.clienteId,
    valor: data.valor,
    condicaoPagamento: data.condicaoPagamento,
    prazoExecucao: data.prazoExecucao,
    garantiaMeses: data.garantiaMeses,
    escopo: data.escopo,
    obrigacoesCliente: data.obrigacoesCliente ?? "",
    obrigacoesEmpresa: data.obrigacoesEmpresa ?? "",
    clausulasExtras: data.clausulasExtras ?? "",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/contratos/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            Editar {data.numero}
          </h2>
          <p className="text-sm text-gray-500">{data.cliente?.nome}</p>
        </div>
      </div>

      <ContratoForm
        defaultValues={defaults}
        lockOrcamento
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/contratos/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
