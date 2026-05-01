import { prisma } from "./prisma";

/**
 * Sistema de geração de notificações automáticas.
 *
 * Cada função "generateXxx" inspeciona o banco e cria registros em Notificacao
 * para os usuários adequados, sempre evitando duplicação dentro de uma janela
 * de 24h baseada em userId + tipo + link.
 *
 * Esses helpers são puros (não dependem de request/sessão) e podem ser
 * chamados via cron — vide /api/cron/notifications.
 */

type NotifPayload = {
  userId: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cria uma notificação se ainda não existe equivalente nas últimas 24h. */
async function createIfNotDuplicate(payload: NotifPayload): Promise<boolean> {
  const since = new Date(Date.now() - DAY_MS);
  const existing = await prisma.notificacao.findFirst({
    where: {
      userId: payload.userId,
      tipo: payload.tipo,
      link: payload.link ?? null,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (existing) return false;
  await prisma.notificacao.create({
    data: {
      userId: payload.userId,
      tipo: payload.tipo,
      titulo: payload.titulo,
      mensagem: payload.mensagem,
      link: payload.link ?? null,
    },
  });
  return true;
}

/** Retorna ids de usuários ativos com a role informada. */
async function getUsersByRoles(roles: string[]): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { active: true, role: { in: roles } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

function formatBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Geradores ─────────────────────────────────────────────────────────────────

export async function generateOrcamentoVencendo(): Promise<number> {
  const hoje = startOfToday();
  const limite = addDays(hoje, 5);
  const orcamentos = await prisma.orcamento.findMany({
    where: {
      status: "ENVIADO",
      dataValidade: { gte: hoje, lte: limite },
    },
    select: {
      id: true,
      numero: true,
      dataValidade: true,
      vendedorId: true,
      cliente: { select: { nome: true } },
    },
  });
  let created = 0;
  for (const o of orcamentos) {
    const ok = await createIfNotDuplicate({
      userId: o.vendedorId,
      tipo: "ORCAMENTO_VENCENDO",
      titulo: `Orçamento ${o.numero} vence em breve`,
      mensagem: `O orçamento de ${o.cliente.nome} expira em ${formatBR(o.dataValidade)}.`,
      link: `/dashboard/orcamento/${o.id}`,
    });
    if (ok) created++;
  }
  return created;
}

export async function generateOrcamentoVencido(): Promise<number> {
  const hoje = startOfToday();
  const orcamentos = await prisma.orcamento.findMany({
    where: {
      status: "ENVIADO",
      dataValidade: { lt: hoje },
    },
    select: {
      id: true,
      numero: true,
      vendedorId: true,
      cliente: { select: { nome: true } },
    },
  });
  let created = 0;
  for (const o of orcamentos) {
    await prisma.orcamento.update({
      where: { id: o.id },
      data: { status: "VENCIDO" },
    });
    const ok = await createIfNotDuplicate({
      userId: o.vendedorId,
      tipo: "ORCAMENTO_VENCIDO",
      titulo: `Orçamento ${o.numero} venceu`,
      mensagem: `O orçamento de ${o.cliente.nome} foi marcado como VENCIDO.`,
      link: `/dashboard/orcamento/${o.id}`,
    });
    if (ok) created++;
  }
  return created;
}

export async function generateObraAtrasada(): Promise<number> {
  const hoje = startOfToday();
  const obras = await prisma.obra.findMany({
    where: {
      status: "EM_ANDAMENTO",
      previsaoTermino: { lt: hoje },
    },
    select: {
      id: true,
      numero: true,
      nome: true,
      responsavelId: true,
      previsaoTermino: true,
    },
  });
  let created = 0;
  for (const o of obras) {
    await prisma.obra.update({
      where: { id: o.id },
      data: { status: "ATRASADA" },
    });
    const ok = await createIfNotDuplicate({
      userId: o.responsavelId,
      tipo: "OBRA_ATRASADA",
      titulo: `Obra ${o.numero} está atrasada`,
      mensagem: `A obra "${o.nome}" passou da previsão de término (${formatBR(o.previsaoTermino)}).`,
      link: `/dashboard/obras/${o.id}`,
    });
    if (ok) created++;
  }
  return created;
}

export async function generateContaReceberVencendo(): Promise<number> {
  const hoje = startOfToday();
  const limite = addDays(hoje, 3);
  const contas = await prisma.contaReceber.findMany({
    where: {
      status: { in: ["ABERTA", "PARCIAL"] },
      vencimento: { gte: hoje, lte: limite },
    },
    select: {
      id: true,
      descricao: true,
      valor: true,
      vencimento: true,
      cliente: { select: { nome: true } },
    },
  });
  if (contas.length === 0) return 0;
  const adminIds = await getUsersByRoles(["ADMIN", "FINANCEIRO"]);
  let created = 0;
  for (const c of contas) {
    for (const userId of adminIds) {
      const ok = await createIfNotDuplicate({
        userId,
        tipo: "CONTA_RECEBER_VENCENDO",
        titulo: `Conta a receber vence em breve`,
        mensagem: `${c.cliente.nome} — ${c.descricao} (${formatBRL(c.valor)}) vence em ${formatBR(c.vencimento)}.`,
        link: `/dashboard/financeiro?contaReceber=${c.id}`,
      });
      if (ok) created++;
    }
  }
  return created;
}

export async function generateContaPagarVencendo(): Promise<number> {
  const hoje = startOfToday();
  const limite = addDays(hoje, 3);
  const contas = await prisma.contaPagar.findMany({
    where: {
      status: { in: ["ABERTA", "PARCIAL"] },
      vencimento: { gte: hoje, lte: limite },
    },
    select: {
      id: true,
      descricao: true,
      valor: true,
      vencimento: true,
      fornecedor: { select: { nome: true } },
    },
  });
  if (contas.length === 0) return 0;
  const adminIds = await getUsersByRoles(["ADMIN", "FINANCEIRO"]);
  let created = 0;
  for (const c of contas) {
    for (const userId of adminIds) {
      const ok = await createIfNotDuplicate({
        userId,
        tipo: "CONTA_PAGAR_VENCENDO",
        titulo: `Conta a pagar vence em breve`,
        mensagem: `${c.fornecedor?.nome ?? "Despesa"} — ${c.descricao} (${formatBRL(c.valor)}) vence em ${formatBR(c.vencimento)}.`,
        link: `/dashboard/financeiro?contaPagar=${c.id}`,
      });
      if (ok) created++;
    }
  }
  return created;
}

export async function generateGarantiaVencendo(): Promise<number> {
  const hoje = startOfToday();
  const limite = addDays(hoje, 30);
  const garantias = await prisma.garantia.findMany({
    where: {
      status: "ATIVA",
      dataFim: { gte: hoje, lte: limite },
    },
    select: {
      id: true,
      dataFim: true,
      cliente: { select: { nome: true } },
      obra: { select: { numero: true } },
    },
  });
  if (garantias.length === 0) return 0;
  const adminIds = await getUsersByRoles(["ADMIN"]);
  let created = 0;
  for (const g of garantias) {
    for (const userId of adminIds) {
      const ok = await createIfNotDuplicate({
        userId,
        tipo: "GARANTIA_VENCENDO",
        titulo: `Garantia próxima do vencimento`,
        mensagem: `Garantia da obra ${g.obra.numero} (${g.cliente.nome}) expira em ${formatBR(g.dataFim)}.`,
        link: `/dashboard/garantias?garantiaId=${g.id}`,
      });
      if (ok) created++;
    }
  }
  return created;
}

export async function generateEstoqueBaixo(): Promise<number> {
  // Materiais ativos cujo estoqueAtual <= estoqueMinimo (e estoqueMinimo > 0).
  const materiais = await prisma.material.findMany({
    where: { ativo: true, estoqueMinimo: { gt: 0 } },
    select: {
      id: true,
      nome: true,
      unidade: true,
      estoqueAtual: true,
      estoqueMinimo: true,
    },
  });
  const baixos = materiais.filter((m) => m.estoqueAtual <= m.estoqueMinimo);
  if (baixos.length === 0) return 0;
  const adminIds = await getUsersByRoles(["ADMIN"]);
  let created = 0;
  for (const m of baixos) {
    for (const userId of adminIds) {
      const ok = await createIfNotDuplicate({
        userId,
        tipo: "ESTOQUE_BAIXO",
        titulo: `Estoque baixo: ${m.nome}`,
        mensagem: `${m.nome} está em ${m.estoqueAtual} ${m.unidade} (mínimo ${m.estoqueMinimo}).`,
        link: `/dashboard/estoque?materialId=${m.id}`,
      });
      if (ok) created++;
    }
  }
  return created;
}

export type RunAllChecksResult = {
  created: number;
  byType: Record<string, number>;
};

export async function runAllChecks(): Promise<RunAllChecksResult> {
  const byType: Record<string, number> = {
    ORCAMENTO_VENCENDO: 0,
    ORCAMENTO_VENCIDO: 0,
    OBRA_ATRASADA: 0,
    CONTA_RECEBER_VENCENDO: 0,
    CONTA_PAGAR_VENCENDO: 0,
    GARANTIA_VENCENDO: 0,
    ESTOQUE_BAIXO: 0,
  };

  byType.ORCAMENTO_VENCENDO = await generateOrcamentoVencendo();
  byType.ORCAMENTO_VENCIDO = await generateOrcamentoVencido();
  byType.OBRA_ATRASADA = await generateObraAtrasada();
  byType.CONTA_RECEBER_VENCENDO = await generateContaReceberVencendo();
  byType.CONTA_PAGAR_VENCENDO = await generateContaPagarVencendo();
  byType.GARANTIA_VENCENDO = await generateGarantiaVencendo();
  byType.ESTOQUE_BAIXO = await generateEstoqueBaixo();

  const created = Object.values(byType).reduce((acc, n) => acc + n, 0);
  return { created, byType };
}
