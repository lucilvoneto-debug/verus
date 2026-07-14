import Link from "next/link";
import {
  DollarSign, FileText, CheckCircle2, Hammer, AlertTriangle, ArrowDownCircle,
  ArrowUpCircle, Percent, Search,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ObrasStatusChart } from "@/components/dashboard/ObrasStatusChart";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getDashboardData } from "@/lib/dashboard";
import { obraStatusLabel, obraStatusTone, etapaStatusLabel, etapaStatusTone } from "@/lib/status";

export const dynamic = "force-dynamic";

function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { kpis, revenueChart, obrasStatusChart, obrasEmAndamento, tarefasProximas } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Visão geral</h2>
          <p className="text-sm text-gray-500">
            Acompanhe os indicadores comerciais, operacionais e financeiros do mês.
          </p>
        </div>
        <Link href="/dashboard/busca" className="btn-outline">
          <Search className="w-4 h-4" /> Buscar
        </Link>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Faturamento mês"
          value={formatCurrency(kpis.faturamentoMes)}
          hint="Recebido neste mês"
          tone="blue"
          icon={DollarSign}
        />
        <KpiCard
          label="Orçamentos enviados"
          value={String(kpis.orcamentosEnviados)}
          hint="Últimos 30 dias"
          tone="neutral"
          icon={FileText}
        />
        <KpiCard
          label="Orçamentos aprovados"
          value={String(kpis.orcamentosAprovados)}
          hint={`Taxa de conversão ${formatPercent(kpis.taxaConversao)}`}
          tone="green"
          icon={CheckCircle2}
        />
        <KpiCard
          label="Obras em andamento"
          value={String(kpis.obrasEmAndamento)}
          hint={`${kpis.obrasAtrasadas} atrasadas`}
          tone="blue"
          icon={Hammer}
        />
        <KpiCard
          label="Obras atrasadas"
          value={String(kpis.obrasAtrasadas)}
          hint={kpis.obrasAtrasadas > 0 ? "Atenção SLA" : "Sem atrasos"}
          tone="red"
          icon={AlertTriangle}
        />
        <KpiCard
          label="Contas a receber"
          value={formatCurrency(kpis.contasReceberTotal)}
          hint={`${kpis.contasReceberVencidas} vencidas`}
          tone="yellow"
          icon={ArrowDownCircle}
        />
        <KpiCard
          label="Contas a pagar"
          value={formatCurrency(kpis.contasPagarTotal)}
          hint={`${kpis.contasPagarVencendo7d} vencendo em 7 dias`}
          tone="neutral"
          icon={ArrowUpCircle}
        />
        <KpiCard
          label="Margem média"
          value={formatPercent(kpis.margemMedia)}
          hint="Aprovados últimos 90d"
          tone="green"
          icon={Percent}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Faturamento — últimos 6 meses</CardTitle>
            <Badge tone="blue">{new Date().getFullYear()}</Badge>
          </CardHeader>
          <RevenueChart data={revenueChart} />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Obras por status</CardTitle>
            <Badge tone="neutral">Atual</Badge>
          </CardHeader>
          <ObrasStatusChart data={obrasStatusChart} />
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-0">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <CardTitle>Obras em andamento</CardTitle>
            <Badge tone="blue">{obrasEmAndamento.length}</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="table-verus">
              <thead>
                <tr>
                  <th>Obra</th><th>Cliente</th><th>Responsável</th>
                  <th>Início</th><th>Previsão</th><th>Progresso</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {obrasEmAndamento.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-sm text-gray-500 py-6">
                      Nenhuma obra em andamento.
                    </td>
                  </tr>
                ) : (
                  obrasEmAndamento.map((o) => (
                    <tr key={o.id}>
                      <td className="font-medium">{o.numero}</td>
                      <td>{o.cliente}</td>
                      <td>{o.responsavel}</td>
                      <td>{formatDate(o.inicio)}</td>
                      <td>{formatDate(o.previsao)}</td>
                      <td className="min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand"
                              style={{ width: `${o.progresso}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 tabular-nums">{o.progresso}%</span>
                        </div>
                      </td>
                      <td>
                        <Badge tone={obraStatusTone(o.status)}>{obraStatusLabel(o.status)}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <CardTitle>Próximas tarefas</CardTitle>
            <Badge tone="neutral">{tarefasProximas.length}</Badge>
          </div>
          {tarefasProximas.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">Nenhuma tarefa nos próximos 14 dias.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {tarefasProximas.map((t) => (
                <li key={t.id} className="px-5 py-3">
                  <div className="text-sm font-medium text-brand-dark">{t.etapa}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span>{t.obraNumero} · {t.obraNome}</span>
                    <span>·</span>
                    <span>{formatDate(t.dataPrevista, "dd/MM")}</span>
                    <Badge tone={etapaStatusTone(t.status)}>{etapaStatusLabel(t.status)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
