"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { etapaStatusLabel, etapaStatusTone } from "@/lib/status";
import { Plus } from "lucide-react";

type Etapa = {
  id: string;
  ordem: number;
  nome: string;
  status: string;
  dataPrevista: string;
  dataRealizada: string | null;
  responsavelId: string | null;
};

export function ObraTabCronograma({ obraId, etapas }: { obraId: string; etapas: Etapa[] }) {
  const sorted = [...etapas].sort((a, b) => a.ordem - b.ordem);
  return (
    <Card className="p-0">
      <div className="flex items-center justify-between p-4">
        <h3 className="font-display text-lg font-semibold">Cronograma</h3>
        <Link href={`/dashboard/etapas/nova?obraId=${obraId}`} className="btn-primary">
          <Plus className="w-4 h-4" /> Nova etapa
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="table-impermeia">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th>Nome</th>
              <th>Prevista</th>
              <th>Realizada</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  Nenhuma etapa cadastrada.
                </td>
              </tr>
            )}
            {sorted.map((e) => (
              <tr key={e.id}>
                <td className="tabular-nums">{e.ordem}</td>
                <td className="font-medium">{e.nome}</td>
                <td>{formatDate(e.dataPrevista)}</td>
                <td>{e.dataRealizada ? formatDate(e.dataRealizada) : "—"}</td>
                <td>
                  <Badge tone={etapaStatusTone(e.status)}>{etapaStatusLabel(e.status)}</Badge>
                </td>
                <td className="text-right pr-4">
                  <Link href={`/dashboard/etapas/${e.id}`} className="text-brand text-sm hover:underline">
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
