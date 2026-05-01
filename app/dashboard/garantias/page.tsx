"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { useGarantias, useDeleteGarantia } from "@/hooks/useGarantias";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "ATIVA", label: "Ativa" },
  { value: "EXPIRADA", label: "Expirada" },
  { value: "ACIONADA", label: "Acionada" },
];

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  ATIVA: "green",
  EXPIRADA: "neutral",
  ACIONADA: "yellow",
};

function diasRestantes(dataFim: string | Date): number {
  const fim = new Date(dataFim);
  const now = new Date();
  return Math.ceil((fim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GarantiasPage() {
  const [status, setStatus] = useState("");
  const [clienteId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useGarantias({
    status: status || undefined,
    clienteId: clienteId || undefined,
    inicio: inicio || undefined,
    fim: fim || undefined,
    page,
    pageSize,
  });
  const del = useDeleteGarantia();

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta garantia?")) return;
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
          <h2 className="font-display text-2xl font-bold text-brand-dark">Garantias</h2>
          <p className="text-sm text-gray-500">
            Termos de garantia e acompanhamento de prazos.
          </p>
        </div>
        <Link href="/dashboard/garantias/nova" className="btn-primary">
          <Plus className="w-4 h-4" /> Nova garantia
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="input-verus"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input-verus"
            value={inicio}
            onChange={(e) => {
              setInicio(e.target.value);
              setPage(1);
            }}
            placeholder="De"
          />
          <input
            type="date"
            className="input-verus"
            value={fim}
            onChange={(e) => {
              setFim(e.target.value);
              setPage(1);
            }}
            placeholder="Até"
          />
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Obra</th>
                <th>Cliente</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Prazo</th>
                <th>Vencimento</th>
                <th>Status</th>
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
              {!isLoading && data?.data?.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-8">
                    Nenhuma garantia encontrada.
                  </td>
                </tr>
              )}
              {data?.data?.map(
                (g: {
                  id: string;
                  obra: { numero: string; nome: string };
                  cliente: { nome: string };
                  dataInicio: string;
                  dataFim: string;
                  prazoMeses: number;
                  status: string;
                }) => {
                  const dias = diasRestantes(g.dataFim);
                  let venceCor = "text-green-600";
                  if (dias <= 30) venceCor = "text-red-600 font-semibold";
                  else if (dias <= 90) venceCor = "text-amber-600 font-semibold";
                  return (
                    <tr key={g.id}>
                      <td className="font-medium">
                        {g.obra.numero} — {g.obra.nome}
                      </td>
                      <td>{g.cliente.nome}</td>
                      <td>{formatDate(g.dataInicio)}</td>
                      <td>{formatDate(g.dataFim)}</td>
                      <td className="tabular-nums">{g.prazoMeses} meses</td>
                      <td className={`tabular-nums ${venceCor}`}>
                        {dias < 0 ? `Vencida há ${-dias}d` : `${dias} dias`}
                      </td>
                      <td>
                        <Badge tone={statusTone[g.status] ?? "neutral"}>{g.status}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1 pr-2">
                          <Link
                            href={`/dashboard/garantias/${g.id}`}
                            className="p-2 rounded hover:bg-gray-100 text-gray-600"
                            aria-label="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(g.id)}
                            className="p-2 rounded hover:bg-red-50 text-red-600"
                            aria-label="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 text-sm">
            <span className="text-gray-500">
              {data.total} garantia(s) · página {data.page} de {data.totalPages}
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
