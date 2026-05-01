"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye } from "lucide-react";
import { useServicos, useDeleteServico } from "@/hooks/useServicos";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

const unidadeOpts = [
  { value: "", label: "Todas as unidades" },
  { value: "M2", label: "m²" },
  { value: "METRO_LINEAR", label: "Metro linear" },
  { value: "DIARIA", label: "Diária" },
  { value: "UNIDADE", label: "Unidade" },
];

const unidadeLabel: Record<string, string> = {
  M2: "m²",
  METRO_LINEAR: "ml",
  DIARIA: "diária",
  UNIDADE: "un",
};

export default function ServicosPage() {
  const [q, setQ] = useState("");
  const [unidade, setUnidade] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useServicos({ q, unidade, page, pageSize });
  const del = useDeleteServico();

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o serviço "${nome}"?`)) return;
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
          <h2 className="font-display text-2xl font-bold text-brand-dark">Serviços</h2>
          <p className="text-sm text-gray-500">Catálogo de serviços de impermeabilização.</p>
        </div>
        <Link href="/dashboard/servicos/novo" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo serviço
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Buscar por nome..."
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
            value={unidade}
            onChange={(e) => {
              setUnidade(e.target.value);
              setPage(1);
            }}
          >
            {unidadeOpts.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
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
                <th>Nome</th>
                <th>Unidade</th>
                <th>Custo padrão</th>
                <th>Preço padrão</th>
                <th>Margem %</th>
                <th>Ativo</th>
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
                    Nenhum serviço encontrado.
                  </td>
                </tr>
              )}
              {data?.data.map(
                (s: {
                  id: string;
                  nome: string;
                  unidade: string;
                  custoPadrao: number;
                  precoPadrao: number;
                  ativo: boolean;
                }) => {
                  const margem =
                    s.precoPadrao > 0
                      ? ((s.precoPadrao - s.custoPadrao) / s.precoPadrao) * 100
                      : 0;
                  return (
                    <tr key={s.id}>
                      <td className="font-medium">{s.nome}</td>
                      <td>
                        <Badge tone="neutral">{unidadeLabel[s.unidade] ?? s.unidade}</Badge>
                      </td>
                      <td>{formatCurrency(s.custoPadrao)}</td>
                      <td>{formatCurrency(s.precoPadrao)}</td>
                      <td className="tabular-nums">{margem.toFixed(1)}%</td>
                      <td>
                        <Badge tone={s.ativo ? "green" : "neutral"}>
                          {s.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1 pr-2">
                          <Link
                            href={`/dashboard/servicos/${s.id}`}
                            className="p-2 rounded hover:bg-gray-100 text-gray-600"
                            aria-label="Ver"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/servicos/${s.id}/editar`}
                            className="p-2 rounded hover:bg-gray-100 text-gray-600"
                            aria-label="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(s.id, s.nome)}
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
              {data.total} serviço(s) · página {data.page} de {data.totalPages}
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
