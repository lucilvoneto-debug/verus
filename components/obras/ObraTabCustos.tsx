"use client";

import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Movimentacao = {
  id: string;
  quantidade: number;
  custoUnit: number;
  createdAt: string;
  material: { id: string; nome: string; unidade: string };
};

export function ObraTabCustos({
  movimentacoes,
  valorContrato,
  custoMateriais,
  custoEquipe,
  custoTotal,
  margemReal,
}: {
  movimentacoes: Movimentacao[];
  valorContrato: number;
  custoMateriais: number;
  custoEquipe: number;
  custoTotal: number;
  margemReal: number;
}) {
  const margemPct = valorContrato > 0 ? (margemReal / valorContrato) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard label="Valor do contrato" value={formatCurrency(valorContrato)} tone="blue" />
        <KpiCard label="Custo total" value={formatCurrency(custoTotal)} tone="yellow" />
        <KpiCard label="Margem real" value={formatCurrency(margemReal)} tone={margemReal >= 0 ? "green" : "red"} />
        <KpiCard label="Margem %" value={`${margemPct.toFixed(1)}%`} tone={margemPct >= 0 ? "green" : "red"} />
      </div>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Resumo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Row label="Custo de materiais" value={formatCurrency(custoMateriais)} />
          <Row label="Custo de equipe (em construção)" value={formatCurrency(custoEquipe)} />
        </div>
      </Card>

      <Card className="p-0">
        <h3 className="font-display text-lg font-semibold p-4">Movimentações de materiais (saídas)</h3>
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Data</th>
                <th>Material</th>
                <th>Quantidade</th>
                <th>Custo unit.</th>
                <th className="text-right pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    Nenhuma saída de material registrada.
                  </td>
                </tr>
              )}
              {movimentacoes.map((m) => (
                <tr key={m.id}>
                  <td>{formatDate(m.createdAt)}</td>
                  <td>{m.material.nome}</td>
                  <td className="tabular-nums">
                    {m.quantidade} {m.material.unidade}
                  </td>
                  <td className="tabular-nums">{formatCurrency(m.custoUnit)}</td>
                  <td className="text-right pr-4 tabular-nums">
                    {formatCurrency(m.quantidade * m.custoUnit)}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "yellow" | "red";
}) {
  const toneClass: Record<string, string> = {
    blue: "border-t-brand",
    green: "border-t-emerald-500",
    yellow: "border-t-amber-500",
    red: "border-t-red-500",
  };
  return (
    <div className={`card border-t-4 ${toneClass[tone]}`}>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="font-display text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
