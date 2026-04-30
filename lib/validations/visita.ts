import { z } from "zod";

export const visitaSchema = z.object({
  clienteId: z.string().min(1, "Cliente obrigatório"),
  tecnicoId: z.string().min(1, "Técnico obrigatório"),
  atendimentoId: z.string().optional().or(z.literal("")),
  endereco: z.string().min(2, "Endereço obrigatório"),
  dataAgendada: z.string().min(1, "Data obrigatória"),
  observacoes: z.string().optional().or(z.literal("")),
});

export const visitaUpdateSchema = visitaSchema.extend({
  status: z.enum(["AGENDADA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]).optional(),
  diagnostico: z.string().optional().or(z.literal("")),
  tipoSuperficie: z.string().optional().or(z.literal("")),
  causaProvavel: z.string().optional().or(z.literal("")),
  solucaoRecomendada: z.string().optional().or(z.literal("")),
  medidas: z.string().optional().or(z.literal("")),
  fotos: z.string().optional().or(z.literal("")),
});

export type VisitaInput = z.infer<typeof visitaSchema>;
export type VisitaUpdateInput = z.infer<typeof visitaUpdateSchema>;
