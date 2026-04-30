"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Eye, Image as ImageIcon } from "lucide-react";
import { useEtapas } from "@/hooks/useEtapas";
import { useObrasLite, useColaboradoresPorFuncao } from "@/hooks/useObras";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { etapaStatusLabel, etapaStatusTone } from "@/lib/status";

const statusOpts = [
  { value: "", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "ATRASADA", label: "Atrasada" },
];

export default function EtapasPage() {
  const [obraId, setObraId] = useState("");
  const [status, setStatus] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useEtapas({ obraId, status, responsavelId, page, pageSize });
  const obras = useObrasLite();
  const colabs = useColaboradoresPorFuncao([]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Etapas</h2>
          <p className="text-sm text-gray-500">Visão consolidada das etapas de todas as obras.</p>
        </div>
        <Link href="/dashboard/etapas/nova" className="btn-primary">
          <Plus className="w-4 h-4" /> Nova etapa
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            className="input-impermeia"
            value={obraId}
            onChange={(e) => {
              setObraId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas as obras</option>
            {obras.data?.data.map((o) => (
              <option key={o.id} value={o.id}>
                {o.numero} · {o.nome}
              </option>
            ))}
          </select>
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
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-impermeia">
            <thead>
              <tr>
                <th>Obra</th>
                <th>#</th>
                <th>Etapa</th>
                <th>Responsável</th>
                <th>Data prevista</th>
                <th>Status</th>
                <th>Fotos</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-8">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-8">
                    Nenhuma etapa encontrada.
                  </td>
                </tr>
              )}
              {data?.data.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="font-medium tabular-nums text-sm">{e.obra.numero}</div>
                    <div className="text-xs text-gray-500">{e.obra.nome}</div>
                  </td>
                  <td className="tabular-nums">{e.ordem}</td>
                  <td className="font-medium">{e.nome}</td>
                  <td>{e.responsavel?.name ?? "—"}</td>
                  <td>{formatDate(e.dataPrevista)}</td>
                  <td>
                    <Badge tone={etapaStatusTone(e.status)}>{etapaStatusLabel(e.status)}</Badge>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <ImageIcon className="w-3.5 h-3.5" />
                      {e.fotosCount}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1 pr-2">
                      <Link
                        href={`/dashboard/etapas/${e.id}`}
                        className="p-2 rounded hover:bg-gray-100 text-gray-600"
                        aria-label="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
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
              {data.total} etapa(s) · página {data.page} de {data.totalPages}
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
