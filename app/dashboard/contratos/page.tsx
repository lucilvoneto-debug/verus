"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye } from "lucide-react";
import { useContratos, useDeleteContrato } from "@/hooks/useContratos";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusOpts = [
  { value: "", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "ASSINADO", label: "Assinado" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "FINALIZADO", label: "Finalizado" },
];

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  PENDENTE: "yellow",
  ASSINADO: "green",
  CANCELADO: "red",
  FINALIZADO: "blue",
};

export default function ContratosPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useContratos({ q, status, page, pageSize });
  const del = useDeleteContrato();

  async function handleDelete(id: string, numero: string) {
    if (!confirm(`Excluir o contrato ${numero}?`)) return;
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
          <h2 className="font-display text-2xl font-bold text-brand-dark">Contratos</h2>
          <p className="text-sm text-gray-500">Gestão de contratos assinados e cláusulas.</p>
        </div>
        <Link href="/dashboard/contratos/novo" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo contrato
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Número</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Início</th>
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
                    Nenhum contrato encontrado.
                  </td>
                </tr>
              )}
              {data?.data.map(
                (c: {
                  id: string;
                  numero: string;
                  valor: number;
                  status: string;
                  dataInicio: string | null;
                  cliente: { nome: string };
                }) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.numero}</td>
                    <td>{c.cliente?.nome ?? "—"}</td>
                    <td>{formatCurrency(c.valor)}</td>
                    <td>
                      <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge>
                    </td>
                    <td>{c.dataInicio ? formatDate(c.dataInicio) : "—"}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <Link
                          href={`/dashboard/contratos/${c.id}`}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          aria-label="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/dashboard/contratos/${c.id}/editar`}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id, c.numero)}
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
              {data.total} contrato(s) · página {data.page} de {data.totalPages}
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
