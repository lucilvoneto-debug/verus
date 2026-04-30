"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Eye, Trash2 } from "lucide-react";
import { useObras, useDeleteObra, useColaboradoresPorFuncao } from "@/hooks/useObras";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { obraStatusLabel, obraStatusTone } from "@/lib/status";

const statusOpts = [
  { value: "", label: "Todos os status" },
  { value: "AGUARDANDO", label: "Aguardando" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "PAUSADA", label: "Pausada" },
  { value: "ATRASADA", label: "Atrasada" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

export default function ObrasPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useObras({ q, status, responsavelId, inicio, fim, page, pageSize });
  const colabs = useColaboradoresPorFuncao(["SUPERVISOR", "ENGENHEIRO"]);
  const del = useDeleteObra();

  async function handleDelete(id: string, numero: string) {
    if (!confirm(`Excluir a obra ${numero}?`)) return;
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
          <h2 className="font-display text-2xl font-bold text-brand-dark">Obras</h2>
          <p className="text-sm text-gray-500">Andamento, equipe e cronograma das obras.</p>
        </div>
        <Link href="/dashboard/obras/nova" className="btn-primary">
          <Plus className="w-4 h-4" /> Nova obra
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Buscar por número, nome, cliente..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <select
            className="input-impermeia"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {statusOpts.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            className="input-impermeia"
            value={responsavelId}
            onChange={(e) => {
              setResponsavelId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os responsáveis</option>
            {colabs.data?.data
              .filter((c) => c.userId)
              .map((c) => (
                <option key={c.id} value={c.userId as string}>
                  {c.nome}
                </option>
              ))}
          </select>
          <input
            type="date"
            className="input-impermeia"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
          <input
            type="date"
            className="input-impermeia"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-impermeia">
            <thead>
              <tr>
                <th>Número</th>
                <th>Nome</th>
                <th>Cliente</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Início</th>
                <th>Previsão</th>
                <th>Progresso</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 py-8">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 py-8">
                    Nenhuma obra encontrada.
                  </td>
                </tr>
              )}
              {data?.data.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium tabular-nums">{o.numero}</td>
                  <td>{o.nome}</td>
                  <td>{o.cliente.nome}</td>
                  <td>{o.responsavel?.name ?? "—"}</td>
                  <td>
                    <Badge tone={obraStatusTone(o.status)}>{obraStatusLabel(o.status)}</Badge>
                  </td>
                  <td>{formatDate(o.dataInicio)}</td>
                  <td>{formatDate(o.previsaoTermino)}</td>
                  <td className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand"
                          style={{ width: `${o.progresso}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-gray-600">{o.progresso}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1 pr-2">
                      <Link
                        href={`/dashboard/obras/${o.id}`}
                        className="p-2 rounded hover:bg-gray-100 text-gray-600"
                        aria-label="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(o.id, o.numero)}
                        className="p-2 rounded hover:bg-red-50 text-red-600"
                        aria-label="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm">
            <span className="text-gray-500">
              {data.total} obra(s) · página {data.page} de {data.totalPages}
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
