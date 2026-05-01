"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye } from "lucide-react";
import { useFornecedores, useDeleteFornecedor } from "@/hooks/useFornecedores";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCNPJ } from "@/lib/utils";

type Fornecedor = {
  id: string;
  nome: string;
  cnpj: string;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
};

export default function FornecedoresPage() {
  const [q, setQ] = useState("");
  const [ativo, setAtivo] = useState("");
  const { data, isLoading } = useFornecedores({ q, ativo, pageSize: 100 });
  const del = useDeleteFornecedor();

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o fornecedor "${nome}"?`)) return;
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
          <h2 className="font-display text-2xl font-bold text-brand-dark">Fornecedores</h2>
          <p className="text-sm text-gray-500">Gestão da base de fornecedores.</p>
        </div>
        <Link href="/dashboard/fornecedores/novo" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo fornecedor
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Buscar por nome ou CNPJ..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <select className="input-verus" value={ativo} onChange={(e) => setAtivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Contato</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Carregando...</td></tr>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Nenhum fornecedor.</td></tr>
              )}
              {data?.data?.map((f: Fornecedor) => (
                <tr key={f.id}>
                  <td className="font-medium">{f.nome}</td>
                  <td className="tabular-nums">{formatCNPJ(f.cnpj)}</td>
                  <td>{f.contato ?? "—"}</td>
                  <td className="text-sm">{f.email ?? "—"}</td>
                  <td className="text-sm">{f.telefone ?? "—"}</td>
                  <td><Badge tone={f.ativo ? "green" : "neutral"}>{f.ativo ? "Ativo" : "Inativo"}</Badge></td>
                  <td>
                    <div className="flex items-center justify-end gap-1 pr-2">
                      <Link href={`/dashboard/fornecedores/${f.id}`} className="p-2 rounded hover:bg-gray-100 text-gray-600">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/dashboard/fornecedores/${f.id}/editar`} className="p-2 rounded hover:bg-gray-100 text-gray-600">
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(f.id, f.nome)}
                        className="p-2 rounded hover:bg-red-50 text-red-600"
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
      </Card>
    </div>
  );
}
