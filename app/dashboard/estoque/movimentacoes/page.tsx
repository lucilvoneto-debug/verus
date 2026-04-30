"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useMovimentacoes } from "@/hooks/useMateriais";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Mov = {
  id: string;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  quantidade: number;
  custoUnit: number;
  createdAt: string;
  observacao: string | null;
  material: { id: string; nome: string; unidade: string };
  obra: { id: string; numero: string; nome: string } | null;
  user: { id: string; name: string } | null;
};

export default function MovimentacoesPage() {
  const [tipo, setTipo] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const { data, isLoading } = useMovimentacoes({ tipo, inicio, fim, page: 1 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/estoque" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Movimentações de estoque</h2>
          <p className="text-sm text-gray-500">Histórico geral de entradas, saídas e ajustes.</p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="input-impermeia" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
          <input type="date" className="input-impermeia" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          <input type="date" className="input-impermeia" value={fim} onChange={(e) => setFim(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-impermeia">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Material</th>
                <th>Quantidade</th>
                <th>Custo unit.</th>
                <th>Obra</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Carregando...</td></tr>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Sem movimentações.</td></tr>
              )}
              {data?.data?.map((m: Mov) => (
                <tr key={m.id}>
                  <td>{formatDateTime(m.createdAt)}</td>
                  <td>
                    <Badge tone={m.tipo === "ENTRADA" ? "green" : m.tipo === "SAIDA" ? "red" : "yellow"}>
                      {m.tipo}
                    </Badge>
                  </td>
                  <td>
                    <Link href={`/dashboard/estoque/${m.material.id}`} className="font-medium hover:underline">
                      {m.material.nome}
                    </Link>
                  </td>
                  <td className="tabular-nums">{m.quantidade} {m.material.unidade}</td>
                  <td className="tabular-nums">{formatCurrency(m.custoUnit)}</td>
                  <td className="text-sm">{m.obra ? `${m.obra.numero} · ${m.obra.nome}` : "—"}</td>
                  <td className="text-sm text-gray-600">{m.user?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
