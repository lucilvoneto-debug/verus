import {
  DollarSign, FileText, CheckCircle2, Hammer, AlertTriangle, ArrowDownCircle,
  ArrowUpCircle, Percent,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ObrasStatusChart } from "@/components/dashboard/ObrasStatusChart";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const obras = [
  { numero: "OB-2026-014", cliente: "Condomínio Vista Mar", responsavel: "Carlos M.", inicio: "2026-04-02", previsao: "2026-05-15", progresso: 62, status: "EM_ANDAMENTO" },
  { numero: "OB-2026-012", cliente: "Construtora Atlas", responsavel: "Paulo R.", inicio: "2026-03-10", previsao: "2026-04-25", progresso: 80, status: "ATRASADA" },
  { numero: "OB-2026-016", cliente: "Edifício Solaris", responsavel: "Carlos M.", inicio: "2026-04-18", previsao: "2026-05-30", progresso: 35, status: "EM_ANDAMENTO" },
  { numero: "OB-2026-017", cliente: "Indústria Norte", responsavel: "João S.", inicio: "2026-04-22", previsao: "2026-06-10", progresso: 12, status: "EM_ANDAMENTO" },
];

const tarefas = [
  { titulo: "Visita técnica – Edifício Aurora", responsavel: "Carlos M.", quando: "2026-05-02 09:00", tipo: "VISITA" },
  { titulo: "Aprovação de orçamento OR-2026-082", responsavel: "Mariana L.", quando: "2026-05-02 14:00", tipo: "ORCAMENTO" },
  { titulo: "Medição mensal – Vista Mar", responsavel: "Paulo R.", quando: "2026-05-03 10:00", tipo: "MEDICAO" },
  { titulo: "Vistoria pós-entrega – Sol Nascente", responsavel: "Carlos M.", quando: "2026-05-05 11:00", tipo: "POSVENDA" },
];

function statusBadge(s: string) {
  const map = {
    EM_ANDAMENTO: { tone: "blue", label: "Em andamento" },
    ATRASADA: { tone: "red", label: "Atrasada" },
    AGUARDANDO: { tone: "neutral", label: "Aguardando" },
    PAUSADA: { tone: "yellow", label: "Pausada" },
    FINALIZADA: { tone: "green", label: "Finalizada" },
  } as const;
  const v = map[s as keyof typeof map] ?? map.AGUARDANDO;
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-dark">Visão geral</h2>
        <p className="text-sm text-gray-500">
          Acompanhe os indicadores comerciais, operacionais e financeiros do mês.
        </p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Faturamento mês" value={formatCurrency(248900)} hint="+15,7% vs. mês anterior" tone="blue" icon={DollarSign} />
        <KpiCard label="Orçamentos enviados" value="42" hint="18 aguardando retorno" tone="neutral" icon={FileText} />
        <KpiCard label="Orçamentos aprovados" value="19" hint="Taxa de conversão 45,2%" tone="green" icon={CheckCircle2} />
        <KpiCard label="Obras em andamento" value="9" hint="2 atrasadas" tone="blue" icon={Hammer} />
        <KpiCard label="Obras atrasadas" value="2" hint="Atenção SLA" tone="red" icon={AlertTriangle} />
        <KpiCard label="Contas a receber" value={formatCurrency(186400)} hint="3 vencidas" tone="yellow" icon={ArrowDownCircle} />
        <KpiCard label="Contas a pagar" value={formatCurrency(94250)} hint="Vencendo em 7 dias" tone="neutral" icon={ArrowUpCircle} />
        <KpiCard label="Margem média" value="32,4%" hint="Meta: 30%" tone="green" icon={Percent} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Faturamento — últimos 6 meses</CardTitle>
            <Badge tone="blue">2026</Badge>
          </CardHeader>
          <RevenueChart />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Obras por status</CardTitle>
            <Badge tone="neutral">Atual</Badge>
          </CardHeader>
          <ObrasStatusChart />
        </Card>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2 p-0">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <CardTitle>Obras em andamento</CardTitle>
            <Badge tone="blue">{obras.length}</Badge>
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
                {obras.map((o) => (
                  <tr key={o.numero}>
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
                    <td>{statusBadge(o.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <CardTitle>Próximas tarefas</CardTitle>
            <Badge tone="neutral">{tarefas.length}</Badge>
          </div>
          <ul className="divide-y divide-gray-100">
            {tarefas.map((t, i) => (
              <li key={i} className="px-5 py-3">
                <div className="text-sm font-medium text-brand-dark">{t.titulo}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {t.responsavel} · {formatDate(t.quando, "dd/MM HH:mm")}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
