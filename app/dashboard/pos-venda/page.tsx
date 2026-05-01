"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Eye } from "lucide-react";
import { useChamados } from "@/hooks/useChamados";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "ABERTO", label: "Aberto" },
  { value: "EM_ATENDIMENTO", label: "Em atendimento" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  ABERTO: "yellow",
  EM_ATENDIMENTO: "blue",
  CONCLUIDO: "green",
  CANCELADO: "red",
};

function truncate(s: string, n = 80) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export default function PosVendaPage() {
  const [status, setStatus] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useChamados({
    status: status || undefined,
    inicio: inicio || undefined,
    fim: fim || undefined,
    page,
    pageSize,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Pós-venda</h2>
          <p className="text-sm text-gray-500">
            Chamados de assistência técnica e satisfação do cliente.
          </p>
        </div>
        <Link href="/dashboard/pos-venda/novo" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo chamado
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
          />
          <input
            type="date"
            className="input-verus"
            value={fim}
            onChange={(e) => {
              setFim(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Abertura</th>
                <th>Cliente</th>
                <th>Obra (garantia)</th>
                <th>Descrição</th>
                <th>Técnico</th>
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
              {!isLoading && data?.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">
                    Nenhum chamado encontrado.
                  </td>
                </tr>
              )}
              {data?.data?.map(
                (c: {
                  id: string;
                  dataAbertura: string;
                  cliente: { nome: string };
                  garantia: { obra: { numero: string; nome: string } };
                  descricao: string;
                  status: string;
                  tecnico?: { name: string } | null;
                }) => (
                  <tr key={c.id}>
                    <td>{formatDate(c.dataAbertura)}</td>
                    <td className="font-medium">{c.cliente.nome}</td>
                    <td>
                      {c.garantia.obra.numero} — {c.garantia.obra.nome}
                    </td>
                    <td className="max-w-md">{truncate(c.descricao)}</td>
                    <td>{c.tecnico?.name ?? "—"}</td>
                    <td>
                      <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <Link
                          href={`/dashboard/pos-venda/${c.id}`}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          aria-label="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
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
              {data.total} chamado(s) · página {data.page} de {data.totalPages}
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
