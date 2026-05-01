"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Eye } from "lucide-react";
import { useCompras } from "@/hooks/useCompras";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type Pedido = {
  id: string;
  numero: string;
  dataPedido: string;
  dataPrevista: string;
  total: number;
  status: string;
  fornecedor: { id: string; nome: string };
};

const statusTone = (s: string) =>
  s === "RECEBIDO" ? "green" : s === "ENVIADO" ? "blue" : s === "CANCELADO" ? "red" : "neutral";

export default function ComprasPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useCompras({ q, status, pageSize: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Compras</h2>
          <p className="text-sm text-gray-500">Pedidos de compra e recebimento de materiais.</p>
        </div>
        <Link href="/dashboard/compras/novo" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo pedido
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Buscar por número..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <select className="input-verus" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="ENVIADO">Enviado</option>
            <option value="RECEBIDO">Recebido</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Número</th>
                <th>Fornecedor</th>
                <th>Data pedido</th>
                <th>Previsão</th>
                <th>Total</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Carregando...</td></tr>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Nenhum pedido.</td></tr>
              )}
              {data?.data?.map((p: Pedido) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.numero}</td>
                  <td>{p.fornecedor.nome}</td>
                  <td>{formatDate(p.dataPedido)}</td>
                  <td>{formatDate(p.dataPrevista)}</td>
                  <td className="tabular-nums">{formatCurrency(p.total)}</td>
                  <td><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                  <td>
                    <div className="flex items-center justify-end gap-1 pr-2">
                      <Link href={`/dashboard/compras/${p.id}`} className="p-2 rounded hover:bg-gray-100 text-gray-600">
                        <Eye className="w-4 h-4" />
                      </Link>
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
