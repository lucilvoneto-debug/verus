"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye } from "lucide-react";
import { useClientes, useDeleteCliente } from "@/hooks/useClientes";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDocumento } from "@/lib/utils";

const categorias = [
  { value: "", label: "Todas as categorias" },
  { value: "RESIDENCIAL", label: "Residencial" },
  { value: "CONDOMINIO", label: "Condomínio" },
  { value: "CONSTRUTORA", label: "Construtora" },
  { value: "EMPRESA", label: "Empresa" },
  { value: "INDUSTRIA", label: "Indústria" },
];

export default function ClientesPage() {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useClientes({ q, tipo, categoria, page, pageSize });
  const del = useDeleteCliente();

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o cliente "${nome}"?`)) return;
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
          <h2 className="font-display text-2xl font-bold text-brand-dark">Clientes</h2>
          <p className="text-sm text-gray-500">Gestão da base de clientes PF e PJ.</p>
        </div>
        <Link href="/dashboard/clientes/novo" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo cliente
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Buscar por nome, documento, e-mail..."
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
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos os tipos</option>
            <option value="PF">PF</option>
            <option value="PJ">PJ</option>
          </select>
          <select
            className="input-impermeia"
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              setPage(1);
            }}
          >
            {categorias.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
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
                <th>Nome</th>
                <th>Tipo</th>
                <th>Documento</th>
                <th>Categoria</th>
                <th>Cidade/UF</th>
                <th>Contato</th>
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
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {data?.data.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.nome}</td>
                  <td>
                    <Badge tone={c.tipo === "PJ" ? "blue" : "neutral"}>{c.tipo}</Badge>
                  </td>
                  <td className="tabular-nums">
                    {formatDocumento(c.documento, c.tipo as "PF" | "PJ")}
                  </td>
                  <td>
                    <Badge tone="neutral">{c.categoria}</Badge>
                  </td>
                  <td>
                    {c.cidade ? `${c.cidade}${c.uf ? "/" + c.uf : ""}` : "—"}
                  </td>
                  <td className="text-sm text-gray-600">
                    {c.email || c.telefone || "—"}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1 pr-2">
                      <Link
                        href={`/dashboard/clientes/${c.id}`}
                        className="p-2 rounded hover:bg-gray-100 text-gray-600"
                        aria-label="Ver"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/dashboard/clientes/${c.id}/editar`}
                        className="p-2 rounded hover:bg-gray-100 text-gray-600"
                        aria-label="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id, c.nome)}
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
              {data.total} cliente(s) · página {data.page} de {data.totalPages}
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
