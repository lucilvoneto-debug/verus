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
});

export type ServicoInput = z.infer<typeof servicoSchema>;
export type ServicoMaterialInput = z.infer<typeof servicoMaterialSchema>;
