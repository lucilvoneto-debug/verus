"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMedicao, useMedicaoAcao } from "@/hooks/useMedicoes";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { medicaoStatusLabel, medicaoStatusTone } from "@/lib/status";

export default function MedicaoDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: m, isLoading } = useMedicao(params.id);
  const acao = useMedicaoAcao(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!m) return <div className="text-gray-500">Medição não encontrada.</div>;

  async function exec(a: "APROVAR" | "FATURAR") {
    try {
      await acao.mutateAsync(a);
      if (a === "FATURAR") alert("Medição faturada. Conta a receber criada com vencimento em 30 dias.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/medicoes" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            Medição {m.numero} · {m.obra.numero}
          </h2>
          <p className="text-sm text-gray-500">
            {m.obra.nome} · {m.obra.cliente?.nome}
          </p>
        </div>
        <Badge tone={medicaoStatusTone(m.status)}>{medicaoStatusLabel(m.status)}</Badge>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Número" value={String(m.numero)} />
          <Field label="Data referência" value={formatDate(m.dataReferencia)} />
          <Field label="% Executado" value={`${m.percentualExecutado.toFixed(1)}%`} />
          <Field label="Valor" value={formatCurrency(m.valor)} />
          <Field label="Faturado em" value={m.faturadoEm ? formatDate(m.faturadoEm) : "—"} />
          <Field label="Criada em" value={formatDate(m.createdAt)} />
        </div>
        {m.observacoes && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Observações</div>
            <p className="text-sm whitespace-pre-wrap">{m.observacoes}</p>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-3">Ações</h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-outline"
            disabled={acao.isPending || m.status !== "PENDENTE"}
            onClick={() => exec("APROVAR")}
          >
            Aprovar
          </button>
          <button
            className="btn-primary"
            disabled={acao.isPending || m.status === "FATURADA"}
            onClick={() => {
              if (
                confirm(
                  "Faturar esta medição? Será criada uma conta a receber para o cliente com vencimento em 30 dias."
                )
              )
                exec("FATURAR");
            }}
          >
            Faturar
          </button>
        </div>
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
