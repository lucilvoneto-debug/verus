"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EtapaForm } from "@/components/etapas/EtapaForm";
import {
  useEtapa,
  useUpdateEtapa,
  useToggleChecklist,
  useUpdateEtapaStatus,
} from "@/hooks/useEtapas";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { etapaStatusLabel, etapaStatusTone } from "@/lib/status";
import type { EtapaInput } from "@/lib/validations/etapa";

export default function EtapaDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: etapa, isLoading } = useEtapa(params.id);
  const update = useUpdateEtapa(params.id);
  const toggle = useToggleChecklist(params.id);
  const setStatus = useUpdateEtapaStatus(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!etapa) return <div className="text-gray-500">Etapa não encontrada.</div>;

  const defaults: Partial<EtapaInput> = {
    obraId: etapa.obraId,
    nome: etapa.nome,
    ordem: etapa.ordem,
    descricao: etapa.descricao ?? "",
    responsavelId: etapa.responsavelId ?? "",
    dataPrevista: etapa.dataPrevista?.slice(0, 10),
    status: etapa.status,
    checklist: etapa.checklist ?? [],
    fotos: etapa.fotos ?? [],
    observacoes: etapa.observacoes ?? "",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/etapas" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{etapa.nome}</h2>
          <p className="text-sm text-gray-500">
            {etapa.obra?.numero} · {etapa.obra?.nome}
          </p>
        </div>
        <Badge tone={etapaStatusTone(etapa.status)}>{etapaStatusLabel(etapa.status)}</Badge>
      </div>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-3">Status</h3>
        <div className="flex flex-wrap gap-2">
          {(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "ATRASADA"] as const).map((s) => (
            <button
              key={s}
              className={`btn-outline ${etapa.status === s ? "border-brand text-brand" : ""}`}
              disabled={setStatus.isPending || etapa.status === s}
              onClick={() => setStatus.mutate(s)}
            >
              {etapaStatusLabel(s)}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-3">Checklist</h3>
        {etapa.checklist?.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum item.</p>
        ) : (
          <ul className="space-y-2">
            {etapa.checklist?.map((it: { nome: string; done: boolean }, i: number) => (
              <li key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-brand"
                  checked={it.done}
                  disabled={toggle.isPending}
                  onChange={(e) => toggle.mutate({ index: i, done: e.target.checked })}
                />
                <span className={it.done ? "line-through text-gray-400 flex-1" : "flex-1"}>
                  {it.nome}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <EtapaForm
        defaultValues={defaults}
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (data) => {
          try {
            await update.mutateAsync(data);
            router.refresh();
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
