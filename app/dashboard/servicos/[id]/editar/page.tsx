"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ServicoForm } from "@/components/servicos/ServicoForm";
import { useServico, useUpdateServico } from "@/hooks/useServicos";
import type { ServicoInput } from "@/lib/validations/servico";

export default function EditarServicoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useServico(params.id);
  const update = useUpdateServico(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;

  const defaults: Partial<ServicoInput> = {
    nome: data.nome,
    descricao: data.descricao ?? "",
    unidade: data.unidade,
    custoPadrao: data.custoPadrao,
    precoPadrao: data.precoPadrao,
    tempoMedio: data.tempoMedio ?? undefined,
    observacoesTecnicas: data.observacoesTecnicas ?? "",
    ativo: data.ativo,
    percaPercent: data.percaPercent ?? undefined,
    maoDeObraPorUnidade: data.maoDeObraPorUnidade ?? undefined,
    equipamentosPorUnidade: data.equipamentosPorUnidade ?? undefined,
    episTransportePorUnidade: data.episTransportePorUnidade ?? undefined,
    bdiPercent: data.bdiPercent ?? undefined,
    impostosPercent: data.impostosPercent ?? undefined,
    lucroPercent: data.lucroPercent ?? undefined,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/servicos/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Editar serviço</h2>
          <p className="text-sm text-gray-500">{data.nome}</p>
        </div>
      </div>

      <ServicoForm
        defaultValues={defaults}
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/servicos/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
