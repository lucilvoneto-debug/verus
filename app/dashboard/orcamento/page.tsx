"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye, Upload } from "lucide-react";
import { useOrcamentos, useDeleteOrcamento } from "@/hooks/useOrcamentos";
import { useColaboradores } from "@/hooks/useVisitas";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusOpts = [
  { value: "", label: "Todos os status" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "ENVIADO", label: "Enviado" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "RECUSADO", label: "Recusado" },
  { value: "VENCIDO", label: "Vencido" },
];

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  RASCUNHO: "neutral",
  ENVIADO: "blue",
  APROVADO: "green",
  RECUSADO: "red",
  VENCIDO: "yellow",
};

export default function OrcamentosPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [vendedorId, setVendedorId] = useState("");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useOrcamentos({
    q,
    status,
    vendedorId,
    dataIni,
    dataFim,
    page,
    pageSize,
  });
  const { data: vendedores } = useColaboradores(["VENDEDOR"]);
  const del = useDeleteOrcamento();

  async function handleDelete(id: string, numero: string) {
    if (!confirm(`Excluir o orçamento ${numero}?`)) return;
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
          <h2 className="font-display text-2xl font-bold text-brand-dark">Orçamentos</h2>
          <p className="text-sm text-gray-500">Elaboração, envio e aprovação de orçamentos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/orcamento/por-planta" className="btn-outline">
            <Upload className="w-4 h-4" /> Por planta (DXF/planilha)
          </Link>
          <Link href="/dashboard/orcamento/novo" className="btn-primary">
            <Plus className="w-4 h-4" /> Novo orçamento
          </Link>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Buscar por número..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <select
            className="input-verus"
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
            className="input-verus"
            value={vendedorId}
            onChange={(e) => {
              setVendedorId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os vendedores</option>
            {vendedores?.data?.map(
              (c: { id: string; nome: string; userId: string | null }) =>
                c.userId && (
                  <option key={c.id} value={c.userId}>
                    {c.nome}
                  </option>
                )
            )}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              className="input-verus"
              value={dataIni}
              onChange={(e) => {
                setDataIni(e.target.value);
                setPage(1);
              }}
            />
            <input
              type="date"
              className="input-verus"
              value={dataFim}
              onChange={(e) => {
                setDataFim(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Total</th>
                <th>Margem %</th>
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
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              )}
              {data?.data.map(
                (o: {
                  id: string;
                  numero: string;
                  criadoEm: string;
                  total: number;
                  margemPrevista: number;
                  status: string;
                  cliente: { nome: string };
                }) => (
                  <tr key={o.id}>
                    <td className="font-medium">{o.numero}</td>
                    <td>{o.cliente?.nome ?? "—"}</td>
                    <td className="tabular-nums">{formatDate(o.criadoEm)}</td>
                    <td>{formatCurrency(o.total)}</td>
                    <td className="tabular-nums">{o.margemPrevista.toFixed(1)}%</td>
                    <td>
                      <Badge tone={statusTone[o.status] ?? "neutral"}>{o.status}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <Link
                          href={`/dashboard/orcamento/${o.id}`}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          aria-label="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/orcamento/${o.id}/editar`}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
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
                )
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm">
            <span className="text-gray-500">
              {data.total} orçamento(s) · página {data.page} de {data.totalPages}
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
