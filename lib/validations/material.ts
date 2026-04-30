import { z } from "zod";

export const materialSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  categoria: z.string().min(1, "Categoria obrigatória"),
  unidade: z.string().min(1, "Unidade obrigatória"),
  custoMedio: z.number().nonnegative().default(0),
  estoqueAtual: z.number().nonnegative().default(0),
  estoqueMinimo: z.number().nonnegative().default(0),
  fornecedorPadraoId: z.string().optional().or(z.literal("")),
  ativo: z.boolean().default(true),
});

export type MaterialInput = z.infer<typeof materialSchema>;

export const movimentacaoSchema = z.object({
  tipo: z.enum(["ENTRADA", "SAIDA", "AJUSTE"]),
  quantidade: z.number().positive("Quantidade obrigatória"),
  custoUnit: z.number().nonnegative().default(0),
  obraId: z.string().optional().or(z.literal("")),
  observacao: z.string().optional().or(z.literal("")),
});

export type MovimentacaoInput = z.infer<typeof movimentacaoSchema>;
