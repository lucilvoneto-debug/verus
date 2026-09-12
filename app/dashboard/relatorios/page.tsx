"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { obraStatusLabel, obraStatusTone } from "@/lib/status";

type Dados = {
  periodo: { inicio: string; fim: string };
  funil: { origem: string; leads: number; ganhos: number; perdidos: number; abertos: number; taxa: number; valorFechado: number }[];
  etapas: { etapa: string; quantidade: number }[];
  motivos: { motivo: string; quantidade: number }[];
  orcamentos: {
    resumo: { total: number; valor: number; aprovados: number; valorAprovado: number; recusados: number; vencidos: number; taxa: number; ticketMedio: number; porVendedor: { vendedor: string; enviados: number; aprovados: number; valorAprovado: number; taxa: number }[] };
    linhas: { numero: string; cliente: string; vendedor: string; status: string; criadoEm: string; total: number; margem: number; m2: number }[];
  };
  obras: { numero: string; nome: string; cliente: string; responsavel: string; status: string; dataInicio: string; previsaoTermino: string; dataConclusao: string | null; valorContrato: number; custoReal: number; margemReal: number; diasAtraso: number; etapas: number; etapasConcluidas: number }[];
  fluxo: { mes: string; recebido: number; pago: number; aReceber: number; aPagar: number; saldo: number }[];
  inadimplencia: { cliente: string; descricao: string; vencimento: string; valor: number; valorPago: number; emAberto: number; diasAtraso: number }[];
  despesas: { categoria: string; valor: number; pago: number }[];
  posVenda: { garantiasAtivas: number; garantiasVencendo90d: number; chamadosAbertos: number; chamadosPeriodo: number; custoReparoPeriodo: number; planosAtivos: number; manutencoesAtrasadas: number; atendimentosAbertos: number };
};

const PERIODOS = [
  { v: "30d", l: "Últimos 30 dias" },
  { v: "mes", l: "Este mês" },
  { v: "trimestre", l: "Últimos 3 meses" },
  { v: "ano", l: "Este ano" },
  { v: "12m", l: "Últimos 12 meses" },
  { v: "custom", l: "Período…" },
];

const SECOES = [
  { k: "comercial", l: "Comercial" },
  { k: "orcamentos", l: "Orçamentos" },
  { k: "obras", l: "Obras" },
  { k: "financeiro", l: "Financeiro" },
  { k: "posvenda", l: "Pós-venda" },
] as const;

function pct(v: number) {
  return `${v.toFixed(1).replace(".", ",")}%`;
}

function mesLabel(k: string) {
  const [y, m] = k.split("-");
  return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(m) - 1]}/${y.slice(2)}`;
}

function BotaoCsv({ secao, qs }: { secao: string; qs: string }) {
  return (
    <a href={`/api/relatorios?formato=csv&secao=${secao}&${qs}`} className="btn-outline text-xs" download>
      <Download className="w-3.5 h-3.5" /> CSV
    </a>
  );
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState("30d");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [secao, setSecao] = useState<(typeof SECOES)[number]["k"]>("comercial");

  const qs = periodo === "custom" && inicio && fim ? `inicio=${inicio}&fim=${fim}` : `periodo=${periodo}`;
  const { data, isLoading, isError } = useQuery<Dados>({
    queryKey: ["relatorios", qs],
    enabled: periodo !== "custom" || (!!inicio && !!fim),
    queryFn: async () => {
      const r = await fetch(`/api/relatorios?${qs}`);
      if (!r.ok) throw new Error("Erro ao carregar relatórios");
      return r.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Relatórios</h2>
          <p className="text-sm text-gray-500">
            Indicadores gerenciais com dados reais
            {data && <> · {formatDate(data.periodo.inicio)} a {formatDate(data.periodo.fim)}</>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="input-verus" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            {PERIODOS.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
          </select>
          {periodo === "custom" && (
            <>
              <input type="date" className="input-verus" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              <input type="date" className="input-verus" value={fim} onChange={(e) => setFim(e.target.value)} />
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {SECOES.map((s) => (
          <button
            key={s.k}
            onClick={() => setSecao(s.k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${secao === s.k ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            {s.l}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Calculando…</p>}
      {isError && <p className="text-sm text-danger">Falha ao carregar.</p>}

      {data && secao === "comercial" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Leads no período" value={String(data.funil.reduce((a, r) => a + r.leads, 0))} />
            <KpiCard label="Ganhos" value={String(data.funil.reduce((a, r) => a + r.ganhos, 0))} tone="green" hint={formatCurrency(data.funil.reduce((a, r) => a + r.valorFechado, 0))} />
            <KpiCard label="Perdidos" value={String(data.funil.reduce((a, r) => a + r.perdidos, 0))} tone="red" />
            <KpiCard
              label="Conversão"
              value={pct(data.funil.reduce((a, r) => a + r.leads, 0) ? (data.funil.reduce((a, r) => a + r.ganhos, 0) / data.funil.reduce((a, r) => a + r.leads, 0)) * 100 : 0)}
              tone="yellow"
              icon={TrendingUp}
            />
          </div>

          <Card className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-display font-semibold text-brand-dark">Funil por origem</h3>
              <BotaoCsv secao="funil" qs={qs} />
            </div>
            <div className="overflow-x-auto">
              <table className="table-verus">
                <thead><tr><th>Origem</th><th>Leads</th><th>Abertos</th><th>Ganhos</th><th>Perdidos</th><th>Conversão</th><th>Valor fechado</th></tr></thead>
                <tbody>
                  {data.funil.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-6">Sem leads no período.</td></tr>}
                  {data.funil.map((r) => (
                    <tr key={r.origem}>
                      <td className="font-medium">{r.origem}</td>
                      <td className="tabular-nums">{r.leads}</td>
                      <td className="tabular-nums">{r.abertos}</td>
                      <td className="tabular-nums text-success">{r.ganhos}</td>
                      <td className="tabular-nums text-danger">{r.perdidos}</td>
                      <td className="tabular-nums">{pct(r.taxa)}</td>
                      <td className="tabular-nums">{formatCurrency(r.valorFechado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-display font-semibold text-brand-dark mb-3">Pipeline hoje (todas as datas)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.etapas} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="etapa" stroke="#94A3B8" fontSize={11} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#0B5FFF" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="font-display font-semibold text-brand-dark">Por que perdemos</h3>
                <BotaoCsv secao="motivos" qs={qs} />
              </div>
              <table className="table-verus">
                <thead><tr><th>Motivo</th><th>Qtd</th></tr></thead>
                <tbody>
                  {data.motivos.length === 0 && <tr><td colSpan={2} className="text-center text-gray-500 py-6">Nenhuma perda no período.</td></tr>}
                  {data.motivos.map((m) => <tr key={m.motivo}><td>{m.motivo}</td><td className="tabular-nums">{m.quantidade}</td></tr>)}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {data && secao === "orcamentos" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Orçamentos" value={String(data.orcamentos.resumo.total)} hint={formatCurrency(data.orcamentos.resumo.valor)} />
            <KpiCard label="Aprovados" value={String(data.orcamentos.resumo.aprovados)} tone="green" hint={formatCurrency(data.orcamentos.resumo.valorAprovado)} />
            <KpiCard label="Taxa de aprovação" value={pct(data.orcamentos.resumo.taxa)} tone="yellow" hint={`${data.orcamentos.resumo.recusados} recusados · ${data.orcamentos.resumo.vencidos} vencidos`} />
            <KpiCard label="Ticket médio" value={formatCurrency(data.orcamentos.resumo.ticketMedio)} tone="neutral" />
          </div>

          <Card className="p-0">
            <div className="px-5 py-3 border-b border-gray-100"><h3 className="font-display font-semibold text-brand-dark">Por vendedor</h3></div>
            <table className="table-verus">
              <thead><tr><th>Vendedor</th><th>Enviados</th><th>Aprovados</th><th>Taxa</th><th>Valor aprovado</th></tr></thead>
              <tbody>
                {data.orcamentos.resumo.porVendedor.map((v) => (
                  <tr key={v.vendedor}><td className="font-medium">{v.vendedor}</td><td className="tabular-nums">{v.enviados}</td><td className="tabular-nums">{v.aprovados}</td><td className="tabular-nums">{pct(v.taxa)}</td><td className="tabular-nums">{formatCurrency(v.valorAprovado)}</td></tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-display font-semibold text-brand-dark">Orçamentos do período</h3>
              <BotaoCsv secao="orcamentos" qs={qs} />
            </div>
            <div className="overflow-x-auto">
              <table className="table-verus">
                <thead><tr><th>Nº</th><th>Cliente</th><th>Vendedor</th><th>Data</th><th>Status</th><th>m²</th><th>Total</th><th>Margem</th></tr></thead>
                <tbody>
                  {data.orcamentos.linhas.map((o) => (
                    <tr key={o.numero}>
                      <td className="font-medium">{o.numero}</td>
                      <td>{o.cliente}</td>
                      <td className="text-sm">{o.vendedor}</td>
                      <td className="text-sm">{formatDate(o.criadoEm)}</td>
                      <td><Badge tone={o.status === "APROVADO" ? "green" : o.status === "RECUSADO" || o.status === "VENCIDO" ? "red" : "blue"}>{o.status}</Badge></td>
                      <td className="tabular-nums">{o.m2 ? o.m2.toFixed(0) : "—"}</td>
                      <td className="tabular-nums">{formatCurrency(o.total)}</td>
                      <td className="tabular-nums">{pct(o.margem)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {data && secao === "obras" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Obras listadas" value={String(data.obras.length)} />
            <KpiCard label="Em andamento" value={String(data.obras.filter((o) => o.status === "EM_ANDAMENTO").length)} tone="yellow" />
            <KpiCard label="Atrasadas" value={String(data.obras.filter((o) => o.diasAtraso > 0 && o.status !== "FINALIZADA").length)} tone="red" />
            <KpiCard label="Margem real média" value={pct(data.obras.length ? data.obras.reduce((a, o) => a + o.margemReal, 0) / data.obras.length : 0)} tone="green" />
          </div>
          <Card className="p-0">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-display font-semibold text-brand-dark">Obras (iniciadas no período + em aberto)</h3>
              <BotaoCsv secao="obras" qs={qs} />
            </div>
            <div className="overflow-x-auto">
              <table className="table-verus">
                <thead><tr><th>Obra</th><th>Cliente</th><th>Resp.</th><th>Status</th><th>Início</th><th>Previsão</th><th>Atraso</th><th>Etapas</th><th>Contrato</th><th>Custo real</th><th>Margem</th></tr></thead>
                <tbody>
                  {data.obras.map((o) => (
                    <tr key={o.numero}>
                      <td><div className="font-medium">{o.numero}</div><div className="text-xs text-gray-500 truncate max-w-[14rem]">{o.nome}</div></td>
                      <td className="text-sm">{o.cliente}</td>
                      <td className="text-sm">{o.responsavel}</td>
                      <td><Badge tone={obraStatusTone(o.status)}>{obraStatusLabel(o.status)}</Badge></td>
                      <td className="text-sm">{formatDate(o.dataInicio)}</td>
                      <td className="text-sm">{formatDate(o.previsaoTermino)}</td>
                      <td className={`tabular-nums text-sm ${o.diasAtraso > 0 ? "text-danger font-medium" : ""}`}>{o.diasAtraso > 0 ? `${o.diasAtraso}d` : "—"}</td>
                      <td className="tabular-nums text-sm">{o.etapasConcluidas}/{o.etapas}</td>
                      <td className="tabular-nums">{formatCurrency(o.valorContrato)}</td>
                      <td className="tabular-nums">{formatCurrency(o.custoReal)}</td>
                      <td className="tabular-nums">{pct(o.margemReal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {data && secao === "financeiro" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="Recebido" value={formatCurrency(data.fluxo.reduce((a, r) => a + r.recebido, 0))} tone="green" />
            <KpiCard label="Pago" value={formatCurrency(data.fluxo.reduce((a, r) => a + r.pago, 0))} tone="red" />
            <KpiCard label="Saldo" value={formatCurrency(data.fluxo.reduce((a, r) => a + r.saldo, 0))} />
            <KpiCard label="Inadimplência" value={formatCurrency(data.inadimplencia.reduce((a, r) => a + r.emAberto, 0))} tone="yellow" hint={`${data.inadimplencia.length} título(s) vencido(s)`} />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-brand-dark">Fluxo mensal (por vencimento)</h3>
              <BotaoCsv secao="fluxo" qs={qs} />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.fluxo.map((r) => ({ ...r, mes: mesLabel(r.mes) }))} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="mes" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="recebido" name="Recebido" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pago" name="Pago" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aReceber" name="A receber" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aPagar" name="A pagar" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="font-display font-semibold text-brand-dark">Títulos vencidos</h3>
                <BotaoCsv secao="inadimplencia" qs={qs} />
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="table-verus">
                  <thead><tr><th>Cliente</th><th>Vencimento</th><th>Atraso</th><th>Em aberto</th></tr></thead>
                  <tbody>
                    {data.inadimplencia.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-6">Nada vencido. 🎉</td></tr>}
                    {data.inadimplencia.map((r, i) => (
                      <tr key={i}><td><div className="font-medium">{r.cliente}</div><div className="text-xs text-gray-500 truncate max-w-[14rem]">{r.descricao}</div></td><td className="text-sm">{formatDate(r.vencimento)}</td><td className="tabular-nums text-danger">{r.diasAtraso}d</td><td className="tabular-nums">{formatCurrency(r.emAberto)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card className="p-0">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <h3 className="font-display font-semibold text-brand-dark">Despesas por categoria</h3>
                <BotaoCsv secao="despesas" qs={qs} />
              </div>
              <table className="table-verus">
                <thead><tr><th>Categoria</th><th>Lançado</th><th>Pago</th></tr></thead>
                <tbody>
                  {data.despesas.length === 0 && <tr><td colSpan={3} className="text-center text-gray-500 py-6">Sem despesas no período.</td></tr>}
                  {data.despesas.map((d) => <tr key={d.categoria}><td>{d.categoria}</td><td className="tabular-nums">{formatCurrency(d.valor)}</td><td className="tabular-nums">{formatCurrency(d.pago)}</td></tr>)}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      )}

      {data && secao === "posvenda" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Garantias ativas" value={String(data.posVenda.garantiasAtivas)} tone="green" hint={`${data.posVenda.garantiasVencendo90d} vencem em 90 dias`} />
          <KpiCard label="Chamados abertos" value={String(data.posVenda.chamadosAbertos)} tone="red" hint={`${data.posVenda.chamadosPeriodo} abertos no período`} />
          <KpiCard label="Custo de reparo (período)" value={formatCurrency(data.posVenda.custoReparoPeriodo)} tone="yellow" />
          <KpiCard label="Atendimentos abertos" value={String(data.posVenda.atendimentosAbertos)} />
          <KpiCard label="Planos de manutenção" value={String(data.posVenda.planosAtivos)} tone="neutral" hint={`${data.posVenda.manutencoesAtrasadas} atrasado(s)`} />
        </div>
      )}
    </div>
  );
}
