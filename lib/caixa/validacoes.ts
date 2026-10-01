import { z } from "zod";

export const CATEGORIAS_CAIXA = [
  "RECEBIMENTO",
  "MAO_DE_OBRA",
  "MATERIAL",
  "COMBUSTIVEL",
  "RETIRADA_SOCIO",
  "APORTE_SOCIO",
  "IMPOSTO_TAXA",
  "ADMINISTRATIVO",
  "MARKETING",
  "AJUSTE",
  "OUTROS",
] as const;

export const CATEGORIA_LABEL: Record<(typeof CATEGORIAS_CAIXA)[number], string> = {
  RECEBIMENTO: "Recebimento de cliente",
  MAO_DE_OBRA: "Mão de obra",
  MATERIAL: "Material",
  COMBUSTIVEL: "Combustível",
  RETIRADA_SOCIO: "Retirada de sócio",
  APORTE_SOCIO: "Aporte de sócio",
  IMPOSTO_TAXA: "Imposto e taxa",
  ADMINISTRATIVO: "Administrativo",
  MARKETING: "Marketing",
  AJUSTE: "Ajuste",
  OUTROS: "Outros",
};

/** Categorias que são dinheiro dos sócios, não resultado da operação. */
export const CATEGORIAS_SOCIO = ["RETIRADA_SOCIO", "APORTE_SOCIO"] as const;

const vazioParaNull = (v: unknown) => (v === "" ? null : v);

export const lancamentoSchema = z.object({
  data: z.string().min(1, "Informe a data"),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
  valor: z.coerce.number().positive("Valor precisa ser maior que zero"),
  descricao: z.string().trim().min(1, "Descreva o lançamento"),
  categoria: z.enum(CATEGORIAS_CAIXA),
  contaId: z.preprocess(vazioParaNull, z.string().nullable().optional()),
  socioId: z.preprocess(vazioParaNull, z.string().nullable().optional()),
  obraId: z.preprocess(vazioParaNull, z.string().nullable().optional()),
  clienteId: z.preprocess(vazioParaNull, z.string().nullable().optional()),
  favorecido: z.preprocess(vazioParaNull, z.string().nullable().optional()),
  forma: z.preprocess(vazioParaNull, z.string().nullable().optional()),
  fonte: z.preprocess(vazioParaNull, z.string().nullable().optional()),
  incerto: z.boolean().optional(),
  observacoes: z.preprocess(vazioParaNull, z.string().nullable().optional()),
});
export type LancamentoInput = z.infer<typeof lancamentoSchema>;

export const contaFinanceiraSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome da conta"),
  banco: z.preprocess(vazioParaNull, z.string().nullable().optional()),
  observacoes: z.preprocess(vazioParaNull, z.string().nullable().optional()),
});

export const saldoContaSchema = z.object({
  contaId: z.string().min(1),
  data: z.string().min(1),
  saldo: z.coerce.number(),
  fonte: z.preprocess(vazioParaNull, z.string().nullable().optional()),
});

/**
 * "2026-05-19" vira meio-dia de Maceió. Sem isso a data vira meia-noite UTC
 * e aparece na tela como o dia anterior (21h do dia 18 em Maceió).
 */
export function dataDoDia(s: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00-03:00`) : new Date(s);
}
