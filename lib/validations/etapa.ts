import { z } from "zod";

export const checklistItemSchema = z.object({
  nome: z.string().min(1),
  done: z.boolean().default(false),
});

export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const etapaSchema = z.object({
  obraId: z.string().min(1, "Obra obrigatória"),
  nome: z.string().min(2, "Nome obrigatório"),
  ordem: z.coerce.number().int().min(1, "Ordem obrigatória"),
  descricao: z.string().optional().or(z.literal("")),
  responsavelId: z.string().optional().or(z.literal("")),
  dataPrevista: z.string().min(1, "Data prevista obrigatória"),
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "ATRASADA"]).default("PENDENTE"),
  checklist: z.array(checklistItemSchema).default([]),
  fotos: z.array(z.string()).default([]),
  observacoes: z.string().optional().or(z.literal("")),
});

export type EtapaInput = z.infer<typeof etapaSchema>;

export const etapaStatusSchema = z.object({
  status: z.enum(["PENDENTE", "EM_ANDAMENTO", "CONCLUIDA", "ATRASADA"]),
});

export const checklistToggleSchema = z.object({
  index: z.coerce.number().int().min(0),
  done: z.boolean(),
});
