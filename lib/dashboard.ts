import { prisma } from "@/lib/prisma";

export type RevenueMonthPoint = { mes: string; valor: number };
export type ObrasStatusPoint = { status: string; qtd: number; color: string };

export type ObraEmAndamentoRow = {
  id: string;
  numero: string;
  cliente: string;
  responsavel: string;
  inicio: Date;
  previsao: Date;
  progresso: number;
  status: string;
};

export type TarefaProximaRow = {
  id: string;
  obraNumero: string;
  obraNome: string;
  etapa: string;
  dataPrevista: Date;
  status: string;
};

export type DashboardData = {
  kpis: {
    faturamentoMes: number;
    orcamentosEnviados: number;
    orcamentosAprovados: number;
    taxaConversao: number;
    obrasEmAndamento: number;
    obrasAtrasadas: number;
    contasReceberTotal: number;
    contasReceberVencidas: number;
    contasPagarTotal: number;
    contasPagarVencendo7d: number;
    margemMedia: number;
  };
  revenueChart: RevenueMonthPoint[];
  obrasStatusChart: ObrasStatusPoint[];
  obrasEmAndamento: ObraEmAndamentoRow[];
  tarefasProximas: TarefaProximaRow[];
};

const MES_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const STATUS_OBRA_COLORS: Record<string, { label: string; color: string }> = {
  AGUARDANDO: { label: "Aguardando", color: "#94A3B8" },
  EM_ANDAMENTO: { label: "Em andamento", color: "#0B5FFF" },
  ATRASADA: { label: "Atrasada", color: "#EF4444" },
  PAUSADA: { label: "Pausada", color: "#F59E0B" },
  FINALIZADA: { label: "Finalizada", color: "#10B981" },
  CANCELADA: { label: "Cancelada", color: "#64748B" },
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const startMes = startOfMonth(now);
  const endMes = endOfMonth(now);
  const last30 = addDays(now, -30);
  const last90 = addDays(now, -90);
  const last6MonthsStart = addMonths(startMes, -5);
  const next7d = addDays(now, 7);
  const next14d = addDays(now, 14);

  const [
    faturamentoAgg,
    orcamentosEnviadosCount,
    orcamentosAprovadosCount,
    obrasEmAndamentoCount,
    obrasAtrasadasCount,
    contasReceberAbertas,
    contasPagarAbertas,
    contasPagarVencendo7d,
    orcamentosAprovadosUltimos90,
    revenueRows,
    obrasStatusGroup,
    obrasInProgress,
    etapasProximas,
  ] = await Promise.all([
    prisma.contaReceber.aggregate({
      _sum: { valorPago: true },
      where: {
        updatedAt: { gte: startMes, lt: endMes },
        valorPago: { gt: 0 },
      },
    }),
    prisma.orcamento.count({
      where: {
        criadoEm: { gte: last30 },
        status: { in: ["ENVIADO", "APROVADO", "RECUSADO", "VENCIDO"] },
      },
    }),
    prisma.orcamento.count({
      where: {
        criadoEm: { gte: last30 },
        status: "APROVADO",
      },
    }),
    prisma.obra.count({ where: { status: "EM_ANDAMENTO" } }),
    prisma.obra.count({ where: { status: "ATRASADA" } }),
    prisma.contaReceber.findMany({
      where: { status: { in: ["ABERTA", "ATRASADA", "PARCIAL"] } },
      select: { valor: true, valorPago: true, vencimento: true },
    }),
    prisma.contaPagar.findMany({
      where: { status: { in: ["ABERTA", "ATRASADA", "PARCIAL"] } },
      select: { valor: true, valorPago: true },
    }),
    prisma.contaPagar.count({
      where: {
        status: { in: ["ABERTA", "ATRASADA", "PARCIAL"] },
        vencimento: { gte: now, lte: next7d },
      },
    }),
    prisma.orcamento.findMany({
      where: { status: "APROVADO", aprovadoEm: { gte: last90 } },
      select: { total: true, custoEstimado: true },
    }),
    prisma.contaReceber.findMany({
      where: {
        valorPago: { gt: 0 },
        updatedAt: { gte: last6MonthsStart },
      },
      select: { valorPago: true, updatedAt: true },
    }),
    prisma.obra.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.obra.findMany({
      where: { status: { in: ["EM_ANDAMENTO", "ATRASADA"] } },
      orderBy: { dataInicio: "desc" },
      take: 5,
      select: {
        id: true,
        numero: true,
        nome: true,
        status: true,
        dataInicio: true,
        previsaoTermino: true,
        cliente: { select: { nome: true } },
        responsavel: { select: { name: true } },
        etapas: { select: { status: true } },
      },
    }),
    prisma.etapa.findMany({
      where: {
        status: { in: ["PENDENTE", "EM_ANDAMENTO"] },
        dataPrevista: { gte: now, lte: next14d },
      },
      orderBy: { dataPrevista: "asc" },
      take: 5,
      select: {
        id: true,
        nome: true,
        status: true,
        dataPrevista: true,
        obra: { select: { numero: true, nome: true } },
      },
    }),
  ]);

  const faturamentoMes = faturamentoAgg._sum.valorPago ?? 0;

  const totalOrcamentosEnviados = orcamentosEnviadosCount;
  const taxaConversao =
    totalOrcamentosEnviados > 0
      ? (orcamentosAprovadosCount / totalOrcamentosEnviados) * 100
      : 0;

  const contasReceberTotal = contasReceberAbertas.reduce(
    (acc, c) => acc + (c.valor - c.valorPago),
    0,
  );
  const contasReceberVencidas = contasReceberAbertas.filter(
    (c) => c.vencimento < now,
  ).length;

  const contasPagarTotal = contasPagarAbertas.reduce(
    (acc, c) => acc + (c.valor - c.valorPago),
    0,
  );

  const margens = orcamentosAprovadosUltimos90
    .filter((o) => o.total > 0)
    .map((o) => (o.total - o.custoEstimado) / o.total);
  const margemMedia =
    margens.length > 0
      ? (margens.reduce((a, b) => a + b, 0) / margens.length) * 100
      : 0;

  // Revenue chart — 6 buckets
  const revenueChart: RevenueMonthPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = addMonths(last6MonthsStart, i);
    const monthEnd = addMonths(monthStart, 1);
    const valor = revenueRows
      .filter((r) => r.updatedAt >= monthStart && r.updatedAt < monthEnd)
      .reduce((acc, r) => acc + r.valorPago, 0);
    revenueChart.push({ mes: MES_LABELS[monthStart.getMonth()], valor });
  }

  const obrasStatusChart: ObrasStatusPoint[] = obrasStatusGroup.map((g) => {
    const meta = STATUS_OBRA_COLORS[g.status] ?? {
      label: g.status,
      color: "#94A3B8",
    };
    return { status: meta.label, qtd: g._count._all, color: meta.color };
  });

  const obrasEmAndamento: ObraEmAndamentoRow[] = obrasInProgress.map((o) => {
    const total = o.etapas.length;
    const concluidas = o.etapas.filter((e) => e.status === "CONCLUIDA").length;
    const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
    return {
      id: o.id,
      numero: o.numero,
      cliente: o.cliente.nome,
      responsavel: o.responsavel.name,
      inicio: o.dataInicio,
      previsao: o.previsaoTermino,
      progresso,
      status: o.status,
    };
  });

  const tarefasProximas: TarefaProximaRow[] = etapasProximas.map((e) => ({
    id: e.id,
    obraNumero: e.obra.numero,
    obraNome: e.obra.nome,
    etapa: e.nome,
    dataPrevista: e.dataPrevista,
    status: e.status,
  }));

  return {
    kpis: {
      faturamentoMes,
      orcamentosEnviados: orcamentosEnviadosCount,
      orcamentosAprovados: orcamentosAprovadosCount,
      taxaConversao,
      obrasEmAndamento: obrasEmAndamentoCount,
      obrasAtrasadas: obrasAtrasadasCount,
      contasReceberTotal,
      contasReceberVencidas,
      contasPagarTotal,
      contasPagarVencendo7d,
      margemMedia,
    },
    revenueChart,
    obrasStatusChart,
    obrasEmAndamento,
    tarefasProximas,
  };
}
