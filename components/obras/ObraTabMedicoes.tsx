"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { medicaoStatusLabel, medicaoStatusTone } from "@/lib/status";
import { Plus } from "lucide-react";

type Medicao = {
  id: string;
  numero: number;
  dataReferencia: string;
  percentualExecutado: number;
  valor: number;
  status: string;
};

export function ObraTabMedicoes({ obraId, medicoes }: { obraId: string; medicoes: Medicao[] }) {
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between p-4">
        <h3 className="font-display text-lg font-semibold">Medições</h3>
        <div className="flex gap-2">
          <Link href={`/dashboard/medicoes?obraId=${obraId}`} className="btn-outline">
            Ver módulo
          </Link>
          <Link href={`/dashboard/medicoes/nova?obraId=${obraId}`} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova medição
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table-impermeia">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Data ref.</th>
              <th>% Executado</th>
              <th>Valor</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {medicoes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  Nenhuma medição registrada.
                </td>
              </tr>
            )}
            {medicoes.map((m) => (
              <tr key={m.id}>
                <td className="tabular-nums font-medium">{m.numero}</td>
                <td>{formatDate(m.dataReferencia)}</td>
                <td className="tabular-nums">{m.percentualExecutado.toFixed(1)}%</td>
                <td className="tabular-nums">{formatCurrency(m.valor)}</td>
                <td>
                  <Badge tone={medicaoStatusTone(m.status)}>{medicaoStatusLabel(m.status)}</Badge>
                </td>
                <td className="text-right pr-4">
                  <Link href={`/dashboard/medicoes/${m.id}`} className="text-brand text-sm hover:underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
