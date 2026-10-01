"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LancamentoModal } from "@/components/caixa/LancamentoModal";
import { CATEGORIA_LABEL } from "@/lib/caixa/validacoes";
import { formatCurrency, formatDate } from "@/lib/utils";

type Socio = {
  id: string; nome: string; participacao: number | null;
  aportou: number; retirou: number; pagouPelaEmpresa: number; recebeuDaEmpresa: number; empresaDeve: number; parteNoResultado: number | null;
};
type Mov = {
  id: string; data: string; tipo: string; valor: number; descricao: string; categoria: keyof typeof CATEGORIA_LABEL;
  socioId: string; fonte: string | null; incerto: boolean; obra: { nome: string } | null;
};
type Resp = { socios: Socio[]; movimentos: Mov[]; resultado: { entradas: number; saidas: number; resultado: number } };

export default function SociosPage() {
  const qc = useQueryClient();
  const [novo, setNovo] = useState(false);
  const { data } = useQuery<Resp>({ queryKey: ["socios"], queryFn: () => fetch("/api/socios").then((r) => r.json()) });
  const nome = (id: string) => data?.socios.find((s) => s.id === id)?.nome ?? "—";

  const totalDevido = (data?.socios ?? []).reduce((t, s) => t + Math.max(0, s.empresaDeve), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Sócios</h2>
          <p className="text-sm text-gray-500">Quem colocou e quem tirou dinheiro da Verus, e como está o acerto entre vocês.</p>
        </div>
        <button className="btn-primary" onClick={() => setNovo(true)}><Plus className="w-4 h-4" /> Lançar retirada ou aporte</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {data?.socios.map((s) => (
          <Card key={s.id}>
            <div className="text-xs text-gray-500">{s.nome}{s.participacao != null ? ` · ${Math.round(s.participacao * 100)}%` : ""}</div>
            <div className="text-sm mt-2">Colocou em dinheiro <b>{formatCurrency(s.aportou)}</b></div>
            <div className="text-sm">Pagou despesa da empresa pela conta dele <b>{formatCurrency(s.pagouPelaEmpresa)}</b></div>
            <div className="text-sm">Tirou <b>{formatCurrency(s.retirou)}</b></div>
            {s.recebeuDaEmpresa > 0 && (
              <div className="text-sm">Recebeu de cliente na conta dele <b>{formatCurrency(s.recebeuDaEmpresa)}</b></div>
            )}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">{s.empresaDeve >= 0 ? "A Verus deve a ele" : "Ele deve à Verus"}</div>
              <div className="font-display text-xl font-bold">{formatCurrency(Math.abs(s.empresaDeve))}</div>
            </div>
          </Card>
        ))}
        <Card>
          <div className="text-xs text-gray-500">Resultado da operação</div>
          <div className="font-display text-2xl font-bold mt-1">{formatCurrency(data?.resultado.resultado ?? 0)}</div>
          <div className="text-xs text-gray-500">
            recebido de clientes ({formatCurrency(data?.resultado.entradas ?? 0)}) menos despesas pagas ({formatCurrency(data?.resultado.saidas ?? 0)})
          </div>
          {data?.socios.some((s) => s.parteNoResultado != null) && (
            <div className="text-xs text-gray-500 mt-1">
              Parte de cada um, se distribuído: {data.socios.map((s) => `${s.nome.split(" ")[0]} ${formatCurrency(s.parteNoResultado ?? 0)}`).join(" · ")}
            </div>
          )}
        </Card>
        <Card className="border-amber-300 bg-amber-50">
          <div className="text-xs text-amber-700">A Verus deve aos sócios</div>
          <div className="font-display text-2xl font-bold mt-1">{formatCurrency(totalDevido)}</div>
          <div className="text-xs text-gray-500">dinheiro e despesas que eles bancaram, menos o que tiraram ou receberam de cliente na conta pessoal</div>
        </Card>
      </div>

      <Card className="p-0">
        <div className="px-4 py-3 border-b border-gray-100 font-display text-lg font-semibold text-brand-dark">Movimentos dos sócios</div>
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead><tr><th>Data</th><th>Sócio</th><th>Tipo</th><th>Descrição</th><th className="text-right">Valor</th><th>De onde veio</th></tr></thead>
            <tbody>
              {data?.movimentos.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap">{formatDate(m.data)}</td>
                  <td>{nome(m.socioId)}</td>
                  <td>
                    <Badge tone={m.categoria === "APORTE_SOCIO" ? "green" : m.categoria === "RETIRADA_SOCIO" ? "red" : "yellow"}>
                      {CATEGORIA_LABEL[m.categoria] ?? m.categoria}
                    </Badge>
                  </td>
                  <td>{m.descricao}{m.obra ? <span className="text-gray-500"> · {m.obra.nome}</span> : null}{m.incerto && <Badge tone="yellow" className="ml-2">conferir</Badge>}</td>
                  <td className={`text-right whitespace-nowrap ${m.tipo === "ENTRADA" ? "text-green-700" : "text-red-600"}`}>{m.tipo === "ENTRADA" ? "+ " : "- "}{formatCurrency(m.valor)}</td>
                  <td className="text-xs text-gray-500">{m.fonte ?? "—"}</td>
                </tr>
              ))}
              {data && data.movimentos.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">Nenhum movimento de sócio ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {novo && (
        <LancamentoModal
          open
          onClose={() => setNovo(false)}
          onSalvo={() => qc.invalidateQueries({ queryKey: ["socios"] })}
          inicial={{ categoria: "RETIRADA_SOCIO", tipo: "SAIDA" }}
        />
      )}
    </div>
  );
}
