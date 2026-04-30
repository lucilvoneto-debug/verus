"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import { useMedicoes } from "@/hooks/useMedicoes";
import { useObrasLite } from "@/hooks/useObras";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { medicaoStatusLabel, medicaoStatusTone } from "@/lib/status";

const statusOpts = [
  { value: "", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "FATURADA", label: "Faturada" },
];

export default function MedicoesPage() {
  const [obraId, setObraId] = useState("");
  const [status, setStatus] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useMedicoes({ obraId, status, inicio, fim, page, pageSize });
  const obras = useObrasLite();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Medições</h2>
          <p className="text-sm text-gray-500">Boletins de medição e faturamento por obra.</p>
        </div>
        <Link href="/dashboard/medicoes/nova" className="btn-primary">
          <Plus className="w-4 h-4" /> Nova medição
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                <th>Obra</th>
                <th>Nº</th>
                <th>Data ref.</th>
                <th>% Executado</th>
                <th>Valor</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">
                    Nenhuma medição encontrada.
                  </td>
                </tr>
              )}
              {data?.data.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="font-medium tabular-nums text-sm">{m.obra.numero}</div>
                    <div className="text-xs text-gray-500">{m.obra.nome}</div>
                  </td>
                  <td className="tabular-nums font-medium">{m.numero}</td>
                  <td>{formatDate(m.dataReferencia)}</td>
                  <td className="tabular-nums">{m.percentualExecutado.toFixed(1)}%</td>
                  <td className="tabular-nums">{formatCurrency(m.valor)}</td>
                  <td>
                    <Badge tone={medicaoStatusTone(m.status)}>{medicaoStatusLabel(m.status)}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1 pr-2">
                      <Link
                        href={`/dashboard/medicoes/${m.id}`}
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
              {data.total} medição(ões) · página {data.page} de {data.totalPages}
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
