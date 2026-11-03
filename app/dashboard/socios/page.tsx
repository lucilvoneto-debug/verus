"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LancamentoModal } from "@/components/caixa/LancamentoModal";
import { CATEGORIA_LABEL } from "@/lib/caixa/validacoes";
import { formatCurrency, formatDate } from "@/lib/utils";

type Item = { id: string; data: string; descricao: string; valor: number; forma: "DINHEIRO" | "DESPESA" | "REEMBOLSO" };
type Socio = {
  id: string; nome: string; participacao: number | null;
  investiu: number; colocouEmDinheiro: number; pagouPelaEmpresa: number; recebeuDeVolta: number;
  retirou: number; retirouDoDinheiroDeCliente: number; recebeuDaEmpresa: number; empresaDeve: number; parteNoResultado: number | null;
  investimentos: Item[]; reembolsos: Item[];
};
type Mov = {
  id: string; data: string; tipo: string; valor: number; descricao: string; categoria: keyof typeof CATEGORIA_LABEL;
  socioId: string; fonte: string | null; incerto: boolean; obra: { nome: string } | null;
};
type Resp = { socios: Socio[]; movimentos: Mov[]; resultado: { entradas: number; saidas: number; resultado: number } };

const FORMA: Record<Item["forma"], { label: string; tone: "blue" | "yellow" | "green" }> = {
  DINHEIRO: { label: "dinheiro", tone: "blue" },
  DESPESA: { label: "despesa paga", tone: "yellow" },
  REEMBOLSO: { label: "reembolso", tone: "green" },
};

const primeiroNome = (nome: string) => nome.split(" ")[0];

function Linha({ titulo, detalhe, valor, grande, cor }: { titulo: string; detalhe?: string; valor: number; grande?: boolean; cor?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{titulo}</div>
        {detalhe && <div className="text-xs text-gray-500">{detalhe}</div>}
      </div>
      <div className={`whitespace-nowrap tabular-nums ${grande ? "font-display text-xl font-bold" : "text-sm font-semibold"} ${cor ?? ""}`}>
        {formatCurrency(valor)}
      </div>
    </div>
  );
}

function Saldo({ s }: { s: Socio }) {
  return (
    <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between gap-3">
      <div className="text-sm font-semibold">{s.empresaDeve >= 0 ? "A Verus ainda deve a ele" : "Ele deve à Verus"}</div>
      <div className={`font-display text-2xl font-bold whitespace-nowrap tabular-nums ${s.empresaDeve >= 0 ? "text-brand" : "text-red-600"}`}>
        {formatCurrency(Math.abs(s.empresaDeve))}
      </div>
    </div>
  );
}

function ListaItens({ titulo, total, itens, vazio, verde }: { titulo: string; total: number; itens: Item[]; vazio: string; verde?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-semibold">
        {titulo} · <span className={`tabular-nums ${verde ? "text-green-700" : ""}`}>{formatCurrency(total)}</span>
      </div>
      {itens.length === 0 ? (
        <div className="text-sm text-gray-500 py-2">{vazio}</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {itens.map((i) => (
            <li key={i.id} className="flex items-baseline gap-3 py-2 text-sm">
              <span className="w-16 shrink-0 text-xs text-gray-500 tabular-nums">{formatDate(i.data, "dd/MM/yy")}</span>
              <span className="min-w-0 flex-1">
                {i.descricao} <Badge tone={FORMA[i.forma].tone} className="ml-1">{FORMA[i.forma].label}</Badge>
              </span>
              <span className={`whitespace-nowrap tabular-nums ${verde ? "text-green-700" : ""}`}>{formatCurrency(i.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SociosPage() {
  const qc = useQueryClient();
  const [novo, setNovo] = useState(false);
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const { data } = useQuery<Resp>({ queryKey: ["socios"], queryFn: () => fetch("/api/socios").then((r) => r.json()) });
  const nome = (id: string) => data?.socios.find((s) => s.id === id)?.nome ?? "—";
  const atual = data?.socios.find((s) => s.id === escolhido) ?? data?.socios[0];

  const totalDevido = (data?.socios ?? []).reduce((t, s) => t + Math.max(0, s.empresaDeve), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Sócios</h2>
          <p className="text-sm text-gray-500">Quanto cada sócio investiu, quanto já recebeu de volta e quanto falta.</p>
        </div>
        <button className="btn-primary" onClick={() => setNovo(true)}><Plus className="w-4 h-4" /> Lançar retirada ou aporte</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.socios.map((s) => {
          const devolvido = s.investiu > 0 ? Math.min(100, Math.round((s.recebeuDeVolta / s.investiu) * 100)) : 0;
          return (
            <Card key={s.id} className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-display text-xl font-bold text-brand-dark">{primeiroNome(s.nome)}</div>
                {s.participacao != null && <div className="text-xs text-gray-500">{Math.round(s.participacao * 100)}%</div>}
              </div>
              <Linha
                titulo="Investiu na Verus"
                detalhe={`${formatCurrency(s.colocouEmDinheiro)} em dinheiro + ${formatCurrency(s.pagouPelaEmpresa)} pagando despesas`}
                valor={s.investiu}
                grande
              />
              <Linha
                titulo="Recebeu de volta"
                detalhe={s.reembolsos.length === 0 ? "nenhum reembolso" : `${s.reembolsos.length} ${s.reembolsos.length === 1 ? "reembolso" : "reembolsos"} da Verus`}
                valor={s.recebeuDeVolta}
                grande
                cor="text-green-700"
              />
              {s.recebeuDeVolta > 0 && (
                <div>
                  <div className="h-2 rounded bg-brand-light overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${devolvido}%` }} /></div>
                  <div className="text-xs text-gray-500 mt-1">{devolvido}% do que investiu já voltou</div>
                </div>
              )}
              {s.recebeuDaEmpresa > 0 && (
                <Linha titulo="Recebeu de cliente na conta dele" detalhe="dinheiro da Verus que ficou com ele" valor={s.recebeuDaEmpresa} />
              )}
              {s.retirou !== 0 && (
                <Linha
                  titulo="Tirou"
                  detalhe={s.retirouDoDinheiroDeCliente > 0
                    ? `${formatCurrency(s.retirouDoDinheiroDeCliente)} saíram do dinheiro de cliente que estava com ele: não descontam de novo`
                    : undefined}
                  valor={s.retirou}
                />
              )}
              <Saldo s={s} />
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="text-xs text-gray-500">Resultado da operação</div>
          <div className="font-display text-2xl font-bold mt-1">{formatCurrency(data?.resultado.resultado ?? 0)}</div>
          <div className="text-xs text-gray-500">
            recebido de clientes ({formatCurrency(data?.resultado.entradas ?? 0)}) menos despesas pagas ({formatCurrency(data?.resultado.saidas ?? 0)})
          </div>
          {data?.socios.some((s) => s.parteNoResultado != null) && (
            <div className="text-xs text-gray-500 mt-1">
              Parte de cada um, se distribuído: {data.socios.map((s) => `${primeiroNome(s.nome)} ${formatCurrency(s.parteNoResultado ?? 0)}`).join(" · ")}
            </div>
          )}
        </Card>
        <Card className="border-amber-300 bg-amber-50">
          <div className="text-xs text-amber-700">A Verus deve aos sócios</div>
          <div className="font-display text-2xl font-bold mt-1">{formatCurrency(totalDevido)}</div>
          <div className="text-xs text-gray-500">o que eles investiram, menos o que já receberam de volta, tiraram ou receberam de cliente na conta pessoal</div>
        </Card>
      </div>

      {atual && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-display text-lg font-semibold text-brand-dark">Extrato do sócio</div>
            <div className="flex gap-2" role="group" aria-label="Escolher sócio">
              {data?.socios.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={s.id === atual.id}
                  onClick={() => setEscolhido(s.id)}
                  className={s.id === atual.id ? "btn-primary" : "btn-outline"}
                >
                  {primeiroNome(s.nome)}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ListaItens titulo="O que investiu" total={atual.investiu} itens={atual.investimentos} vazio="Nada investido ainda." />
            <div className="space-y-3 min-w-0">
              <ListaItens titulo="O que recebeu de volta" total={atual.recebeuDeVolta} itens={atual.reembolsos} vazio="Nenhum reembolso ainda." verde />
              <Saldo s={atual} />
              {(atual.recebeuDaEmpresa > 0 || atual.retirou !== 0) && (
                <div className="text-xs text-gray-500">O saldo conta também o que ele recebeu de cliente na conta dele e o que tirou.</div>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Despesa paga do bolso entra aqui quando a conta a pagar diz &quot;pago por {primeiroNome(atual.nome)}&quot;; reembolso entra quando o Pix da Verus é lançado como devolução de aporte ao sócio.
          </div>
        </Card>
      )}

      <Card className="p-0">
        <div className="px-4 py-3 border-b border-gray-100 font-display text-lg font-semibold text-brand-dark">Movimentos dos sócios</div>
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead><tr><th>Data</th><th>Sócio</th><th>Tipo</th><th>Descrição</th><th className="text-right">Valor</th><th>De onde veio</th></tr></thead>
            <tbody>
              {data?.movimentos.map((m) => {
                const reembolso = m.categoria === "APORTE_SOCIO" && m.tipo === "SAIDA";
                return (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap">{formatDate(m.data)}</td>
                    <td>{nome(m.socioId)}</td>
                    <td>
                      <Badge tone={reembolso ? "blue" : m.categoria === "APORTE_SOCIO" ? "green" : m.categoria === "RETIRADA_SOCIO" ? "red" : "yellow"}>
                        {reembolso ? "Reembolso ao sócio" : CATEGORIA_LABEL[m.categoria] ?? m.categoria}
                      </Badge>
                    </td>
                    <td>{m.descricao}{m.obra ? <span className="text-gray-500"> · {m.obra.nome}</span> : null}{m.incerto && <Badge tone="yellow" className="ml-2">conferir</Badge>}</td>
                    <td className={`text-right whitespace-nowrap ${m.tipo === "ENTRADA" ? "text-green-700" : "text-red-600"}`}>{m.tipo === "ENTRADA" ? "+ " : "- "}{formatCurrency(m.valor)}</td>
                    <td className="text-xs text-gray-500">{m.fonte ?? "—"}</td>
                  </tr>
                );
              })}
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
