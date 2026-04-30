"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Trash2, Pencil, Eye } from "lucide-react";
import { useVisitas, useDeleteVisita, useColaboradores } from "@/hooks/useVisitas";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

const statusOpts = [
  { value: "", label: "Todos os status" },
  { value: "AGENDADA", label: "Agendada" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  AGENDADA: "blue",
  EM_ANDAMENTO: "yellow",
  CONCLUIDA: "green",
  CANCELADA: "red",
};

export default function VisitasPage() {
  const [status, setStatus] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useVisitas({ status, tecnicoId, dataIni, dataFim, page, pageSize });
  const { data: tecnicos } = useColaboradores(["TECNICO", "ENGENHEIRO"]);
  const del = useDeleteVisita();

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta visita?")) return;
    try {
      await del.mutateAsync(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Visitas técnicas</h2>
          <p className="text-sm text-gray-500">
            Agendamento e diagnóstico técnico no campo.
          </p>
        </div>
        <Link href="/dashboard/visita/nova" className="btn-primary">
          <Plus className="w-4 h-4" /> Nova visita
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="input-impermeia"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {statusOpts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="input-impermeia"
            value={tecnicoId}
            onChange={(e) => {
              setTecnicoId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os técnicos</option>
            {tecnicos?.data?.map(
              (c: { id: string; nome: string; userId: string | null; funcao: string }) =>
                c.userId && (
                  <option key={c.id} value={c.userId}>
                    {c.nome} ({c.funcao})
                  </option>
                )
            )}
          </select>
          <input
            type="date"
            className="input-impermeia"
            value={dataIni}
            onChange={(e) => {
              setDataIni(e.target.value);
              setPage(1);
            }}
          />
          <input
            type="date"
            className="input-impermeia"
            value={dataFim}
            onChange={(e) => {
              setDataFim(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-impermeia">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Endereço</th>
                <th>Técnico</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhuma visita encontrada.
                  </td>
                </tr>
              )}
              {data?.data.map(
                (v: {
                  id: string;
                  dataAgendada: string;
                  endereco: string;
                  status: string;
                  cliente: { nome: string };
                  tecnico: { name: string };
                }) => (
                  <tr key={v.id}>
                    <td className="tabular-nums">{formatDateTime(v.dataAgendada)}</td>
                    <td className="font-medium">{v.cliente?.nome ?? "—"}</td>
                    <td className="text-sm text-gray-600 max-w-xs truncate">{v.endereco}</td>
                    <td>{v.tecnico?.name ?? "—"}</td>
                    <td>
                      <Badge tone={statusTone[v.status] ?? "neutral"}>
                        {v.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <Link
                          href={`/dashboard/visita/${v.id}`}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          aria-label="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/visita/${v.id}/editar`}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2 rounded hover:bg-red-50 text-red-600"
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm">
            <span className="text-gray-500">
              {data.total} visita(s) · página {data.page} de {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                className="btn-outline px-3 py-1 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </button>
              <button
                className="btn-outline px-3 py-1 disabled:opacity-50"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
