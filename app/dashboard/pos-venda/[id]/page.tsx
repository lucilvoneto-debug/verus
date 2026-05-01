"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Play, CheckCircle, XCircle } from "lucide-react";
import { useChamado, useChangeChamadoStatus } from "@/hooks/useChamados";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/utils";

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  ABERTO: "yellow",
  EM_ATENDIMENTO: "blue",
  CONCLUIDO: "green",
  CANCELADO: "red",
};

export default function ChamadoDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: c, isLoading } = useChamado(params.id);
  const change = useChangeChamadoStatus(params.id);
  const [custoReparo, setCustoReparo] = useState<string>("");

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!c) return <div className="text-gray-500">Chamado não encontrado.</div>;

  async function setStatus(status: string, payload?: { custoReparo?: number }) {
    try {
      await change.mutateAsync({ status, ...payload });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleConcluir() {
    const valor = Number(custoReparo);
    if (!Number.isFinite(valor) || valor < 0) {
      alert("Informe um custo de reparo válido.");
      return;
    }
    await setStatus("CONCLUIDO", { custoReparo: valor });
  }

  let fotosArr: string[] = [];
  if (c.fotos) {
    try {
      const parsed = JSON.parse(c.fotos);
      if (Array.isArray(parsed)) fotosArr = parsed;
    } catch {
      fotosArr = [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/pos-venda" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            Chamado · {c.cliente.nome}
          </h2>
          <p className="text-sm text-gray-500">
            Aberto em {formatDate(c.dataAbertura)} ·{" "}
            <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {c.status === "ABERTO" && (
            <button
              onClick={() => setStatus("EM_ATENDIMENTO")}
              disabled={change.isPending}
              className="btn-outline"
            >
              <Play className="w-4 h-4" /> Iniciar atendimento
            </button>
          )}
          {(c.status === "ABERTO" || c.status === "EM_ATENDIMENTO") && (
            <button
              onClick={() => setStatus("CANCELADO")}
              disabled={change.isPending}
              className="btn-outline"
            >
              <XCircle className="w-4 h-4" /> Cancelar
            </button>
          )}
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Cliente" value={c.cliente.nome} />
          <Field
            label="Garantia / Obra"
            value={`${c.garantia.obra.numero} — ${c.garantia.obra.nome}`}
          />
          <Field label="Técnico" value={c.tecnico?.name ?? "—"} />
          <Field
            label="Conclusão"
            value={c.dataConclusao ? formatDate(c.dataConclusao) : "—"}
          />
          <Field label="Custo de reparo" value={formatCurrency(c.custoReparo ?? 0)} />
          <Field label="Status" value={c.status} />
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Descrição</div>
          <p className="text-sm whitespace-pre-wrap">{c.descricao}</p>
        </div>

        {c.observacoes && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Observações</div>
            <p className="text-sm whitespace-pre-wrap">{c.observacoes}</p>
          </div>
        )}

        {fotosArr.length > 0 && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Fotos</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {fotosArr.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="w-full h-32 object-cover rounded border border-gray-200"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </Card>

      {c.status === "EM_ATENDIMENTO" && (
        <Card>
          <h3 className="font-display text-lg font-semibold mb-4">Concluir chamado</h3>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custo de reparo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-verus"
                value={custoReparo}
                onChange={(e) => setCustoReparo(e.target.value)}
              />
            </div>
            <button
              onClick={handleConcluir}
              disabled={change.isPending}
              className="btn-primary"
            >
              <CheckCircle className="w-4 h-4" /> Concluir
            </button>
          </div>
        </Card>
      )}
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
