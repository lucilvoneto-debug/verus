import { prisma } from "@/lib/prisma";
import { CATEGORIAS_SOCIO } from "@/lib/caixa/validacoes";

/**
 * Extrato único da empresa. Junta três origens para nada ficar de fora:
 *  - contas a receber com valor pago (dinheiro que entrou de cliente);
 *  - contas a pagar com valor pago (despesa já quitada);
 *  - lançamentos avulsos (retirada/aporte de sócio e o que não tem conta a pagar/receber).
 * Contas a pagar/receber não guardam a data do pagamento; usa-se o vencimento,
 * que é como os lançamentos de 28/09/2026 foram feitos (vencimento = dia em que pagou).
 */
export type LinhaExtrato = {
  id: string;
  origem: "LANCAMENTO" | "CONTA_PAGAR" | "CONTA_RECEBER";
  data: Date;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
  descricao: string;
  categoria: string;
  favorecido: string | null;
  fonte: string | null;
  incerto: boolean;
  conta: { id: string; nome: string } | null;
  socio: { id: string; nome: string } | null;
  socioId: string | null;
  obra: { id: string; nome: string } | null;
};

/** Categoria livre da conta a pagar ("Folha", "Materiais"...) → categoria do extrato. */
export function categoriaDaContaPagar(categoria: string, descricao: string): string {
  const c = categoria.toLowerCase();
  const d = descricao.toLowerCase();
  if (/marketing|tr[aá]fego|an[uú]ncio|social/.test(d)) return "MARKETING";
  if (/multa|imposto|das\b|taxa|tli|crea/.test(d)) return "IMPOSTO_TAXA";
  if (/gasolina|combust/.test(d)) return "COMBUSTIVEL";
  if (c.includes("folha") || /aplicador|ajudante|m[aã]o de obra/.test(d)) return "MAO_DE_OBRA";
  if (c.includes("materia") || /gás|gas|vassoura|manta|primer/.test(d)) return "MATERIAL";
  return "ADMINISTRATIVO";
}

/** Vencimento gravado à meia-noite UTC é data sem hora: mostra como meio-dia de Maceió (senão vira o dia anterior). */
function diaDoVencimento(d: Date): Date {
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 ? new Date(d.getTime() + 15 * 3600 * 1000) : d;
}

type Filtro = { inicio?: Date; fim?: Date; categoria?: string; socioId?: string; obraId?: string; contaId?: string };

export async function extrato(f: Filtro = {}): Promise<LinhaExtrato[]> {
  const periodo = f.inicio || f.fim ? { ...(f.inicio ? { gte: f.inicio } : {}), ...(f.fim ? { lte: f.fim } : {}) } : undefined;

  const [lancs, pagar, receber] = await Promise.all([
    prisma.lancamentoCaixa.findMany({
      where: {
        ...(periodo ? { data: periodo } : {}),
        ...(f.socioId ? { socioId: f.socioId } : {}),
        ...(f.obraId ? { obraId: f.obraId } : {}),
        ...(f.contaId ? { contaId: f.contaId } : {}),
      },
      include: {
        conta: { select: { id: true, nome: true } },
        socio: { select: { id: true, nome: true } },
        obra: { select: { id: true, nome: true } },
      },
    }),
    // Contas a pagar e a receber não têm sócio nem conta: somem quando o filtro é por um deles.
    f.socioId || f.contaId
      ? Promise.resolve([])
      : prisma.contaPagar.findMany({
          where: { valorPago: { gt: 0 }, ...(periodo ? { vencimento: periodo } : {}) },
          include: { fornecedor: { select: { nome: true } } },
        }),
    f.socioId || f.contaId
      ? Promise.resolve([])
      : prisma.contaReceber.findMany({
          where: { valorPago: { gt: 0 }, ...(periodo ? { vencimento: periodo } : {}), ...(f.obraId ? { obraId: f.obraId } : {}) },
          include: { cliente: { select: { nome: true } }, obra: { select: { id: true, nome: true } } },
        }),
  ]);

  const linhas: LinhaExtrato[] = [
    ...lancs.map((l) => ({
      id: l.id,
      origem: "LANCAMENTO" as const,
      data: l.data,
      tipo: l.tipo === "ENTRADA" ? ("ENTRADA" as const) : ("SAIDA" as const),
      valor: l.valor,
      descricao: l.descricao,
      categoria: l.categoria,
      favorecido: l.favorecido,
      fonte: l.fonte,
      incerto: l.incerto,
      conta: l.conta,
      socio: l.socio,
      socioId: l.socioId,
      obra: l.obra,
    })),
    ...(f.obraId ? [] : pagar).map((p) => ({
      id: p.id,
      origem: "CONTA_PAGAR" as const,
      data: diaDoVencimento(p.vencimento),
      tipo: "SAIDA" as const,
      valor: p.valorPago,
      descricao: p.descricao,
      categoria: categoriaDaContaPagar(p.categoria, p.descricao),
      favorecido: p.fornecedor?.nome ?? null,
      fonte: p.observacoes ? `conta a pagar · ${p.observacoes}` : "conta a pagar",
      incerto: /conferir|confirmar|a definir/i.test(p.observacoes ?? ""),
      conta: null,
      socio: null,
      socioId: null,
      obra: null,
    })),
    ...receber.map((r) => ({
      id: r.id,
      origem: "CONTA_RECEBER" as const,
      data: diaDoVencimento(r.vencimento),
      tipo: "ENTRADA" as const,
      valor: r.valorPago,
      descricao: r.descricao,
      categoria: "RECEBIMENTO",
      favorecido: r.cliente?.nome ?? null,
      fonte: r.observacoes ? `conta a receber · ${r.observacoes}` : "conta a receber",
      incerto: /conferir|confirmar/i.test(r.observacoes ?? ""),
      conta: null,
      socio: null,
      socioId: null,
      obra: r.obra,
    })),
  ];

  return linhas
    .filter((l) => !f.categoria || l.categoria === f.categoria)
    .sort((a, b) => b.data.getTime() - a.data.getTime());
}

/** Resultado da operação: tudo que entrou e saiu, sem contar dinheiro dos sócios. */
export function resultado(linhas: LinhaExtrato[]) {
  const op = linhas.filter((l) => !(CATEGORIAS_SOCIO as readonly string[]).includes(l.categoria));
  const entradas = op.filter((l) => l.tipo === "ENTRADA").reduce((s, l) => s + l.valor, 0);
  const saidas = op.filter((l) => l.tipo === "SAIDA").reduce((s, l) => s + l.valor, 0);
  return { entradas, saidas, resultado: entradas - saidas };
}
