"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { obraStatusLabel, obraStatusTone } from "@/lib/status";
import { useUpdateObraStatus } from "@/hooks/useObras";

type ObraDetail = {
  id: string;
  numero: string;
  nome: string;
  endereco: string;
  status: string;
  dataInicio: string;
  previsaoTermino: string;
  dataConclusao: string | null;
  observacoes: string | null;
  progresso: number;
  totalEtapas: number;
  etapasConcluidas: number;
  valorContrato: number;
  custoTotal: number;
  margemReal: number;
  cliente: { id: string; nome: string };
  responsavel: { id: string; name: string } | null;
  contrato: { id: string; numero: string; valor: number; status: string } | null;
};

export function ObraTabDados({ obra }: { obra: ObraDetail }) {
  const upd = useUpdateObraStatus(obra.id);

  async function setStatus(s: string) {
    try {
      await upd.mutateAsync(s);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Badge tone={obraStatusTone(obra.status)}>{obraStatusLabel(obra.status)}</Badge>
            <span className="text-sm text-gray-600">
              {obra.etapasConcluidas} de {obra.totalEtapas} etapas concluídas · {obra.progresso}%
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-outline"
              disabled={upd.isPending || obra.status === "EM_ANDAMENTO"}
              onClick={() => setStatus("EM_ANDAMENTO")}
            >
              Iniciar
            </button>
            <button
              className="btn-outline"
              disabled={upd.isPending || obra.status === "PAUSADA"}
              onClick={() => setStatus("PAUSADA")}
            >
              Pausar
            </button>
            <button
              className="btn-outline"
              disabled={upd.isPending || obra.status === "ATRASADA"}
              onClick={() => setStatus("ATRASADA")}
            >
              Atrasada
            </button>
            <button
              className="btn-primary"
              disabled={upd.isPending || obra.status === "FINALIZADA"}
              onClick={() => setStatus("FINALIZADA")}
            >
              Finalizar
            </button>
            <button
              className="btn-outline text-red-600 border-red-200"
              disabled={upd.isPending || obra.status === "CANCELADA"}
              onClick={() => setStatus("CANCELADA")}
            >
              Cancelar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Número" value={obra.numero} />
          <Field label="Nome" value={obra.nome} />
          <Field label="Cliente" value={obra.cliente.nome} />
          <Field label="Responsável" value={obra.responsavel?.name ?? "—"} />
          <Field label="Endereço" value={obra.endereco} />
          <Field
            label="Contrato"
            value={
              obra.contrato
                ? `${obra.contrato.numero} · ${formatCurrency(obra.contrato.valor)}`
                : "—"
            }
          />
          <Field label="Início" value={formatDate(obra.dataInicio)} />
          <Field label="Previsão término" value={formatDate(obra.previsaoTermino)} />
          <Field
            label="Data conclusão"
            value={obra.dataConclusao ? formatDate(obra.dataConclusao) : "—"}
          />
        </div>
        {obra.observacoes && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Observações</div>
            <p className="text-sm whitespace-pre-wrap">{obra.observacoes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
