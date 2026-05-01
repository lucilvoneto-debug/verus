"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertTriangle, FileDown, Plus } from "lucide-react";
import { useGarantia, useUpdateGarantia } from "@/hooks/useGarantias";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { formatDate } from "@/lib/utils";

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  ATIVA: "green",
  EXPIRADA: "neutral",
  ACIONADA: "yellow",
};

const chamadoStatusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  ABERTO: "yellow",
  EM_ATENDIMENTO: "blue",
  CONCLUIDO: "green",
  CANCELADO: "red",
};

export default function GarantiaDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: g, isLoading } = useGarantia(params.id);
  const update = useUpdateGarantia(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!g) return <div className="text-gray-500">Garantia não encontrada.</div>;

  async function marcarAcionada() {
    if (!confirm("Marcar esta garantia como acionada?")) return;
    try {
      await update.mutateAsync({ status: "ACIONADA" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  const dados = (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Field label="Obra" value={`${g.obra.numero} — ${g.obra.nome}`} />
        <Field label="Cliente" value={g.cliente.nome} />
        <Field label="Data de início" value={formatDate(g.dataInicio)} />
        <Field label="Data de fim" value={formatDate(g.dataFim)} />
        <Field label="Prazo" value={`${g.prazoMeses} meses`} />
        <Field label="Tipo" value={g.tipoGarantia} />
        <Field label="Status" value={g.status} />
      </div>
      {g.condicoes && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Condições</div>
          <p className="text-sm whitespace-pre-wrap">{g.condicoes}</p>
        </div>
      )}
      <div className="mt-6 flex gap-2 flex-wrap">
        <a
          href={`/api/garantias/${g.id}/certificado`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          <FileDown className="w-4 h-4" /> Certificado PDF
        </a>
        {g.status !== "ACIONADA" && (
          <button onClick={marcarAcionada} className="btn-outline">
            <AlertTriangle className="w-4 h-4" /> Marcar como acionada
          </button>
        )}
      </div>
    </Card>
  );

  const chamados = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">
          Chamados ({g.chamados?.length ?? 0})
        </h3>
        <Link
          href={`/dashboard/pos-venda/novo?garantiaId=${g.id}`}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Novo chamado
        </Link>
      </div>
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Abertura</th>
                <th>Descrição</th>
                <th>Técnico</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(!g.chamados || g.chamados.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    Nenhum chamado registrado.
                  </td>
                </tr>
              )}
              {g.chamados?.map(
                (c: {
                  id: string;
                  dataAbertura: string;
                  descricao: string;
                  status: string;
                  tecnico?: { name: string } | null;
                }) => (
                  <tr key={c.id}>
                    <td>{formatDate(c.dataAbertura)}</td>
                    <td className="max-w-md truncate">{c.descricao}</td>
                    <td>{c.tecnico?.name ?? "—"}</td>
                    <td>
                      <Badge tone={chamadoStatusTone[c.status] ?? "neutral"}>{c.status}</Badge>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/pos-venda/${c.id}`}
                        className="text-brand hover:underline text-sm"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/garantias" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            Garantia · {g.obra.numero}
          </h2>
          <p className="text-sm text-gray-500">
            {g.cliente.nome} ·{" "}
            <Badge tone={statusTone[g.status] ?? "neutral"}>{g.status}</Badge>
          </p>
        </div>
        <a
          href={`/api/garantias/${g.id}/certificado`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          <FileDown className="w-4 h-4" /> Certificado PDF
        </a>
      </div>

      <Tabs
        items={[
          { key: "dados", label: "Dados", content: dados },
          {
            key: "chamados",
            label: `Chamados (${g.chamados?.length ?? 0})`,
            content: chamados,
          },
        ]}
      />
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
