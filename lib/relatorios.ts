/**
 * Consultas gerenciais por período. Cada função devolve linhas prontas para
 * tabela na tela e para CSV (mesmo shape). Período = [inicio, fim].
 */

import { prisma } from "./prisma";
import { ETAPAS, ORIGENS } from "./crm/leads";

export type Periodo = { inicio: Date; fim: Date };

export function periodoDe(param: string | null | undefined, inicioParam?: string | null, fimParam?: string | null): Periodo {
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  if (inicioParam && fimParam) {
    const i = new Date(inicioParam);
    const f = new Date(fimParam);
    f.setHours(23, 59, 59, 999);
    return { inicio: i, fim: f };
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  switch (param) {
    case "mes":
      d.setDate(1);
      return { inicio: d, fim: hoje };
    case "trimestre":
      d.setMonth(d.getMonth() - 3);
      return { inicio: d, fim: hoje };
    case "ano":
      d.setMonth(0, 1);
      return { inicio: d, fim: hoje };
    case "12m":
      d.setFullYear(d.getFullYear() - 1);
      return { inicio: d, fim: hoje };
    default:
      d.setDate(d.getDate() - 30);
      return { inicio: d, fim: hoje };
  }
}

const label = (mapa: readonly { value: string; label: string }[], v: string) => mapa.find((m) => m.value === v)?.label ?? v;

// ─── Funil comercial ──────────────────────────────────────────────────────────

export type LinhaFunil = { origem: string; leads: number; ganhos: number; perdidos: number; abertos: number; taxa: number; valorFechado: number };

export async function funilPorOrigem(p: Periodo): Promise<LinhaFunil[]> {
  const leads = await prisma.lead.findMany({
    where: { createdAt: { gte: p.inicio, lte: p.fim } },
    select: { origem: true, status: true, valorFechado: true },
  });
  const m = new Map<string, LinhaFunil>();
  for (const l of leads) {
    const k = ORIGENS[l.origem] ?? l.origem;
    const row = m.get(k) ?? { origem: k, leads: 0, ganhos: 0, perdidos: 0, abertos: 0, taxa: 0, valorFechado: 0 };
    row.leads++;
    if (l.status === "GANHO") {
      row.ganhos++;
      row.valorFechado += l.valorFechado ?? 0;
    } else if (l.status === "PERDIDO") row.perdidos++;
    else row.abertos++;
    m.set(k, row);
  }
  return Array.from(m.values())
    .map((r) => ({ ...r, taxa: r.leads ? (r.ganhos / r.leads) * 100 : 0 }))
    .sort((a, b) => b.leads - a.leads);
}

export type LinhaEtapa = { etapa: string; quantidade: number };
export async function leadsPorEtapa(): Promise<LinhaEtapa[]> {
  const g = await prisma.lead.groupBy({ by: ["status"], _count: { _all: true } });
  return ETAPAS.map((e) => ({ etapa: e.label, quantidade: g.find((x) => x.status === e.value)?._count._all ?? 0 }));
}

export type LinhaMotivo = { motivo: string; quantidade: number };
export async function motivosPerda(p: Periodo): Promise<LinhaMotivo[]> {
  const g = await prisma.lead.groupBy({
    by: ["motivoPerda"],
    where: { status: "PERDIDO", statusEm: { gte: p.inicio, lte: p.fim } },
    _count: { _all: true },
  });
  return g.map((x) => ({ motivo: x.motivoPerda ?? "não informado", quantidade: x._count._all })).sort((a, b) => b.quantidade - a.quantidade);
}

// ─── Orçamentos ───────────────────────────────────────────────────────────────

export type LinhaOrcamento = {
  numero: string; cliente: string; vendedor: string; status: string; criadoEm: Date; total: number; custoEstimado: number; margem: number; m2: number;
};

export async function orcamentosDoPeriodo(p: Periodo): Promise<LinhaOrcamento[]> {
  const rows = await prisma.orcamento.findMany({
    where: { criadoEm: { gte: p.inicio, lte: p.fim } },
    orderBy: { criadoEm: "desc" },
    select: {
      numero: true, status: true, criadoEm: true, total: true, custoEstimado: true,
      cliente: { select: { nome: true } },
      vendedor: { select: { name: true } },
      itens: { select: { area: true, quantidade: true, unidade: true } },
    },
    take: 2000,
  });
  return rows.map((o) => ({
    numero: o.numero,
    cliente: o.cliente.nome,
    vendedor: o.vendedor.name,
    status: o.status,
    criadoEm: o.criadoEm,
    total: o.total,
    custoEstimado: o.custoEstimado,
    margem: o.total > 0 ? ((o.total - o.custoEstimado) / o.total) * 100 : 0,
    m2: o.itens.reduce((acc, i) => acc + (i.area ?? (i.unidade.toLowerCase().includes("m") ? i.quantidade : 0)), 0),
  }));
}

export type ResumoOrcamentos = { total: number; valor: number; aprovados: number; valorAprovado: number; recusados: number; vencidos: number; taxa: number; ticketMedio: number; porVendedor: Array<{ vendedor: string; enviados: number; aprovados: number; valorAprovado: number; taxa: number }> };

export function resumirOrcamentos(rows: LinhaOrcamento[]): ResumoOrcamentos {
  const enviados = rows.filter((r) => r.status !== "RASCUNHO");
  const aprov = rows.filter((r) => r.status === "APROVADO");
  const porV = new Map<string, { vendedor: string; enviados: number; aprovados: number; valorAprovado: number; taxa: number }>();
  for (const r of enviados) {
    const v = porV.get(r.vendedor) ?? { vendedor: r.vendedor, enviados: 0, aprovados: 0, valorAprovado: 0, taxa: 0 };
    v.enviados++;
    if (r.status === "APROVADO") {
      v.aprovados++;
      v.valorAprovado += r.total;
    }
    porV.set(r.vendedor, v);
  }
  return {
    total: rows.length,
    valor: rows.reduce((a, r) => a + r.total, 0),
    aprovados: aprov.length,
    valorAprovado: aprov.reduce((a, r) => a + r.total, 0),
    recusados: rows.filter((r) => r.status === "RECUSADO").length,
    vencidos: rows.filter((r) => r.status === "VENCIDO").length,
    taxa: enviados.length ? (aprov.length / enviados.length) * 100 : 0,
    ticketMedio: aprov.length ? aprov.reduce((a, r) => a + r.total, 0) / aprov.length : 0,
    porVendedor: Array.from(porV.values()).map((v) => ({ ...v, taxa: v.enviados ? (v.aprovados / v.enviados) * 100 : 0 })).sort((a, b) => b.valorAprovado - a.valorAprovado),
  };
}

// ─── Obras ────────────────────────────────────────────────────────────────────

export type LinhaObra = {
  numero: string; nome: string; cliente: string; responsavel: string; status: string; dataInicio: Date; previsaoTermino: Date; dataConclusao: Date | null;
  valorContrato: number; custoReal: number; margemReal: number; diasAtraso: number; etapas: number; etapasConcluidas: number;
};

export async function obrasDoPeriodo(p: Periodo): Promise<LinhaObra[]> {
  const rows = await prisma.obra.findMany({
    where: { OR: [{ dataInicio: { gte: p.inicio, lte: p.fim } }, { status: { in: ["EM_ANDAMENTO", "ATRASADA", "PAUSADA", "AGUARDANDO"] } }] },
    orderBy: { dataInicio: "desc" },
    select: {
      numero: true, nome: true, status: true, dataInicio: true, previsaoTermino: true, dataConclusao: true, custoReal: true, margemReal: true,
      cliente: { select: { nome: true } },
      responsavel: { select: { name: true } },
      contrato: { select: { valor: true } },
      etapas: { select: { status: true } },
    },
    take: 1000,
  });
  const hoje = new Date();
  return rows.map((o) => {
    const fim = o.dataConclusao ?? hoje;
    const atraso = Math.max(0, Math.round((fim.getTime() - o.previsaoTermino.getTime()) / 86400000));
    return {
      numero: o.numero,
      nome: o.nome,
      cliente: o.cliente.nome,
      responsavel: o.responsavel.name,
      status: o.status,
      dataInicio: o.dataInicio,
      previsaoTermino: o.previsaoTermino,
      dataConclusao: o.dataConclusao,
      valorContrato: o.contrato?.valor ?? 0,
      custoReal: o.custoReal,
      margemReal: o.margemReal,
      diasAtraso: o.status === "FINALIZADA" || o.status === "CANCELADA" ? (o.dataConclusao && o.dataConclusao > o.previsaoTermino ? atraso : 0) : atraso,
      etapas: o.etapas.length,
      etapasConcluidas: o.etapas.filter((e) => e.status === "CONCLUIDA").length,
    };
  });
}

// ─── Financeiro ───────────────────────────────────────────────────────────────

export type LinhaMes = { mes: string; recebido: number; pago: number; aReceber: number; aPagar: number; saldo: number };

export async function fluxoMensal(p: Periodo): Promise<LinhaMes[]> {
  const [rec, pag] = await Promise.all([
    prisma.contaReceber.findMany({ where: { vencimento: { gte: p.inicio, lte: p.fim } }, select: { valor: true, valorPago: true, vencimento: true, status: true } }),
    prisma.contaPagar.findMany({ where: { vencimento: { gte: p.inicio, lte: p.fim } }, select: { valor: true, valorPago: true, vencimento: true, status: true } }),
  ]);
  const m = new Map<string, LinhaMes>();
  const chave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const get = (k: string) => m.get(k) ?? { mes: k, recebido: 0, pago: 0, aReceber: 0, aPagar: 0, saldo: 0 };
  for (const r of rec) {
    const row = get(chave(r.vencimento));
    row.recebido += r.valorPago;
    row.aReceber += Math.max(0, r.valor - r.valorPago);
    m.set(row.mes, row);
  }
  for (const r of pag) {
    const row = get(chave(r.vencimento));
    row.pago += r.valorPago;
    row.aPagar += Math.max(0, r.valor - r.valorPago);
    m.set(row.mes, row);
  }
  return Array.from(m.values())
    .map((r) => ({ ...r, saldo: r.recebido - r.pago }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

export type LinhaInadimplente = { cliente: string; descricao: string; vencimento: Date; valor: number; valorPago: number; emAberto: number; diasAtraso: number };

export async function inadimplencia(): Promise<LinhaInadimplente[]> {
  const hoje = new Date();
  const rows = await prisma.contaReceber.findMany({
    where: { status: { in: ["ABERTA", "ATRASADA", "PARCIAL"] }, vencimento: { lt: hoje } },
    orderBy: { vencimento: "asc" },
    select: { descricao: true, vencimento: true, valor: true, valorPago: true, cliente: { select: { nome: true } } },
    take: 1000,
  });
  return rows.map((r) => ({
    cliente: r.cliente.nome,
    descricao: r.descricao,
    vencimento: r.vencimento,
    valor: r.valor,
    valorPago: r.valorPago,
    emAberto: Math.max(0, r.valor - r.valorPago),
    diasAtraso: Math.round((hoje.getTime() - r.vencimento.getTime()) / 86400000),
  }));
}

export type LinhaCategoria = { categoria: string; valor: number; pago: number };
export async function despesasPorCategoria(p: Periodo): Promise<LinhaCategoria[]> {
  const g = await prisma.contaPagar.groupBy({
    by: ["categoria"],
    where: { vencimento: { gte: p.inicio, lte: p.fim } },
    _sum: { valor: true, valorPago: true },
  });
  return g.map((x) => ({ categoria: x.categoria, valor: x._sum.valor ?? 0, pago: x._sum.valorPago ?? 0 })).sort((a, b) => b.valor - a.valor);
}

// ─── Pós-venda ────────────────────────────────────────────────────────────────

export type ResumoPosVenda = {
  garantiasAtivas: number; garantiasVencendo90d: number; chamadosAbertos: number; chamadosPeriodo: number; custoReparoPeriodo: number;
  planosAtivos: number; manutencoesAtrasadas: number; atendimentosAbertos: number;
};

export async function posVenda(p: Periodo): Promise<ResumoPosVenda> {
  const hoje = new Date();
  const em90 = new Date();
  em90.setDate(em90.getDate() + 90);
  const [gAtivas, gVenc, chAb, chPer, custo, planos, atras, atend] = await Promise.all([
    prisma.garantia.count({ where: { dataFim: { gte: hoje } } }),
    prisma.garantia.count({ where: { dataFim: { gte: hoje, lte: em90 } } }),
    prisma.chamadoAssistencia.count({ where: { status: { in: ["ABERTO", "EM_ANDAMENTO"] } } }),
    prisma.chamadoAssistencia.count({ where: { dataAbertura: { gte: p.inicio, lte: p.fim } } }),
    prisma.chamadoAssistencia.aggregate({ _sum: { custoReparo: true }, where: { dataAbertura: { gte: p.inicio, lte: p.fim } } }),
    prisma.planoManutencao.count({ where: { status: "ATIVO" } }),
    prisma.planoManutencao.count({ where: { status: "ATIVO", proximaData: { lt: hoje } } }),
    prisma.atendimento.count({ where: { status: { in: ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_CLIENTE"] } } }),
  ]);
  return {
    garantiasAtivas: gAtivas,
    garantiasVencendo90d: gVenc,
    chamadosAbertos: chAb,
    chamadosPeriodo: chPer,
    custoReparoPeriodo: custo._sum.custoReparo ?? 0,
    planosAtivos: planos,
    manutencoesAtrasadas: atras,
    atendimentosAbertos: atend,
  };
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

const BOM = "\uFEFF";

/** CSV com ; (Excel pt-BR abre direto), BOM UTF-8, datas dd/mm/aaaa, números com vírgula. */
export function paraCsv(rows: Record<string, unknown>[], colunas?: string[]): string {
  if (rows.length === 0) return BOM;
  const cols = colunas ?? Object.keys(rows[0]);
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return new Intl.DateTimeFormat("pt-BR").format(v);
    if (typeof v === "number") return String(Math.round(v * 100) / 100).replace(".", ",");
    const s = String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linhas = [cols.join(";"), ...rows.map((r) => cols.map((c) => esc(r[c])).join(";"))];
  return BOM + linhas.join("\r\n");
}

export function labelEtapaLead(v: string): string {
  return label(ETAPAS, v);
}
