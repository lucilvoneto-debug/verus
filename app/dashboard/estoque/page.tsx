"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil, Eye, ArrowUpDown, List } from "lucide-react";
import {
  useMateriais,
  useDeleteMaterial,
  useMovimentarMaterial,
} from "@/hooks/useMateriais";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { MovimentarModal } from "@/components/estoque/MovimentarModal";

type Material = {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  custoMedio: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  ativo: boolean;
  fornecedorPadrao: { id: string; nome: string } | null;
};

export default function EstoquePage() {
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ativo, setAtivo] = useState("");
  const [baixo, setBaixo] = useState("");
  const [movimentando, setMovimentando] = useState<Material | null>(null);

  const { data, isLoading } = useMateriais({ q, categoria, ativo, baixo, pageSize: 100 });
  const del = useDeleteMaterial();
  const movimentar = useMovimentarMaterial();

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir o material "${nome}"?`)) return;
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
          <h2 className="font-display text-2xl font-bold text-brand-dark">Estoque</h2>
          <p className="text-sm text-gray-500">Materiais, movimentações e estoque mínimo.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/estoque/movimentacoes" className="btn-outline">
            <List className="w-4 h-4" /> Movimentações
          </Link>
          <Link href="/dashboard/estoque/novo" className="btn-primary">
            <Plus className="w-4 h-4" /> Novo material
          </Link>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Buscar por nome..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <select className="input-impermeia" value={ativo} onChange={(e) => setAtivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
          <select className="input-impermeia" value={baixo} onChange={(e) => setBaixo(e.target.value)}>
            <option value="">Todo o estoque</option>
            <option value="true">Estoque baixo</option>
          </select>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-impermeia">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th>Estoque</th>
                <th>Custo médio</th>
                <th>Fornecedor</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="text-center text-gray-500 py-8">Carregando...</td></tr>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-500 py-8">Nenhum material encontrado.</td></tr>
              )}
              {data?.data?.map((m: Material) => {
                const estoqueBaixo = m.estoqueAtual < m.estoqueMinimo;
                return (
                  <tr key={m.id}>
                    <td className="font-medium">{m.nome}</td>
                    <td><Badge tone="neutral">{m.categoria}</Badge></td>
                    <td>{m.unidade}</td>
                    <td>
                      <Badge tone={estoqueBaixo ? "red" : "neutral"}>
                        {m.estoqueAtual} {m.unidade}
                      </Badge>
                    </td>
                    <td className="tabular-nums">{formatCurrency(m.custoMedio)}</td>
                    <td className="text-sm text-gray-600">{m.fornecedorPadrao?.nome ?? "—"}</td>
                    <td>
                      <Badge tone={m.ativo ? "green" : "neutral"}>{m.ativo ? "Ativo" : "Inativo"}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <button
                          onClick={() => setMovimentando(m)}
                          className="p-2 rounded hover:bg-blue-50 text-blue-700"
                          aria-label="Movimentar"
                          title="Movimentar"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                        <Link href={`/dashboard/estoque/${m.id}`} className="p-2 rounded hover:bg-gray-100 text-gray-600">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/dashboard/estoque/${m.id}/editar`} className="p-2 rounded hover:bg-gray-100 text-gray-600">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(m.id, m.nome)}
                          className="p-2 rounded hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <MovimentarModal
        open={!!movimentando}
        onClose={() => setMovimentando(null)}
        custoSugerido={movimentando?.custoMedio}
        unidade={movimentando?.unidade}
        submitting={movimentar.isPending}
        onSubmit={async (d) => {
          if (!movimentando) return;
          try {
            await movimentar.mutateAsync({ id: movimentando.id, data: d });
            setMovimentando(null);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
