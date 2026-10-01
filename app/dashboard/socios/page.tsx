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
  aportou: number; retirou: number; reembolsos: number; direito: number | null; saldo: number | null;
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

  // Acerto entre dois sócios: quem tirou além da sua parte deve ao outro metade da diferença.
  const [a, b] = data?.socios ?? [];
  const acerto =
    a && b && a.saldo != null && b.saldo != null
      ? a.saldo > b.saldo
        ? { quem: b.nome, para: a.nome, valor: (a.saldo - b.saldo) / 2 }
        : { quem: a.nome, para: b.nome, valor: (b.saldo - a.saldo) / 2 }
      : null;

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
            <div className="text-sm mt-2">Colocou <b>{formatCurrency(s.aportou)}</b></div>
            <div className="text-sm">Tirou <b>{formatCurrency(s.retirou)}</b></div>
            <div className="text-xs text-gray-500 mt-1">Despesas pagas a ele pela empresa: {formatCurrency(s.reembolsos)}</div>
          </Card>
        ))}
        <Card>
          <div className="text-xs text-gray-500">Resultado da operação</div>
          <div className="font-display text-2xl font-bold mt-1">{formatCurrency(data?.resultado.resultado ?? 0)}</div>
          <div className="text-xs text-gray-500">recebido de clientes menos gastos, sem contar retiradas e aportes</div>
        </Card>
        <Card className={acerto && acerto.valor > 0.5 ? "border-amber-300 bg-amber-50" : ""}>
          <div className="text-xs text-amber-700">Acerto entre sócios</div>
          {acerto ? (
            acerto.valor > 0.5 ? (
              <div className="font-display text-xl font-bold mt-1">{acerto.quem} deve {formatCurrency(acerto.valor)} a {acerto.para}</div>
            ) : (
              <div className="font-display text-xl font-bold mt-1">Empatados</div>
            )
          ) : (
            <div className="text-sm text-gray-500 mt-1">Cadastre a participação de cada sócio para calcular.</div>
          )}
          <div className="text-xs text-gray-500 mt-1">pela participação de cada um no resultado</div>
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
