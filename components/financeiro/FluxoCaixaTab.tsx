"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { useFluxoCaixa } from "@/hooks/useFluxoCaixa";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function lastDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

type Movimento = {
  id: string;
  data: string;
  tipo: "ENTRADA" | "SAIDA";
  descricao: string;
  contraparte: string;
  valor: number;
  status: "REALIZADO" | "PREVISTO";
};

export function FluxoCaixaTab() {
  const [inicio, setInicio] = useState(firstDayOfMonth());
  const [fim, setFim] = useState(lastDayOfMonth());

  const { data, isLoading } = useFluxoCaixa({ inicio, fim });

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
            <input type="date" className="input-impermeia" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
            <input type="date" className="input-impermeia" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Entradas (realizadas)</div>
              <div className="font-display text-2xl font-bold">
                {formatCurrency(data?.totalEntradas ?? 0)}
              </div>
              <div className="text-xs text-gray-500">
                Previsto: {formatCurrency(data?.previstoEntradas ?? 0)}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Saídas (realizadas)</div>
              <div className="font-display text-2xl font-bold">
                {formatCurrency(data?.totalSaidas ?? 0)}
              </div>
              <div className="text-xs text-gray-500">
                Previsto: {formatCurrency(data?.previstoSaidas ?? 0)}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-light text-brand flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500">Saldo do período</div>
              <div className="font-display text-2xl font-bold">
                {formatCurrency(data?.saldo ?? 0)}
              </div>
              <div className="text-xs text-gray-500">
                Previsto final: {formatCurrency(data?.saldoPrevisto ?? 0)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-impermeia">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Contraparte</th>
                <th className="text-right">Valor</th>
                <th>Status</th>
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
              {!isLoading && data?.movimentos?.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhum movimento no período.
                  </td>
                </tr>
              )}
              {data?.movimentos?.map((m: Movimento) => (
                <tr key={m.id}>
                  <td>{formatDate(m.data)}</td>
                  <td>
                    <Badge tone={m.tipo === "ENTRADA" ? "green" : "red"}>{m.tipo}</Badge>
                  </td>
                  <td>{m.descricao}</td>
                  <td className="text-gray-600">{m.contraparte}</td>
                  <td className="text-right tabular-nums">
                    <span className={m.tipo === "ENTRADA" ? "text-green-700" : "text-red-700"}>
                      {m.tipo === "ENTRADA" ? "+" : "-"} {formatCurrency(m.valor)}
                    </span>
                  </td>
                  <td>
                    <Badge tone={m.status === "REALIZADO" ? "green" : "neutral"}>
                      {m.status}
                    </Badge>
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
