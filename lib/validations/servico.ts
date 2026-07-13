import { z } from "zod";

export const servicoMaterialSchema = z.object({
  materialId: z.string().min(1, "Material obrigatório"),
  quantidade: z.number().positive("Quantidade deve ser positiva"),
});

export const servicoSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  descricao: z.string().optional().or(z.literal("")),
  unidade: z.enum(["M2", "METRO_LINEAR", "DIARIA", "UNIDADE"]),
  custoPadrao: z.number().nonnegative("Custo inválido"),
  precoPadrao: z.number().nonnegative("Preço inválido"),
  tempoMedio: z.number().nonnegative().optional().nullable(),
  observacoesTecnicas: z.string().optional().or(z.literal("")),
  ativo: z.boolean().default(true),

  // Bloco 2 — motor de orçamento. Percentuais são armazenados como fração
  // (0.08 = 8%); a conversão de/para "número que o usuário digita como %"
  // acontece no componente de formulário, não aqui.
  percaPercent: z.number().min(0).max(1).optional().nullable(),
  maoDeObraPorUnidade: z.number().nonnegative().optional().nullable(),
  equipamentosPorUnidade: z.number().nonnegative().optional().nullable(),
  episTransportePorUnidade: z.number().nonnegative().optional().nullable(),
  bdiPercent: z.number().min(0).max(1).optional().nullable(),
  impostosPercent: z.number().min(0).max(1).optional().nullable(),
  lucroPercent: z.number().min(0).max(1).optional().nullable(),
});

export type ServicoInput = z.infer<typeof servicoSchema>;
export type ServicoMaterialInput = z.infer<typeof servicoMaterialSchema>;
