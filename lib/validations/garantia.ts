import { z } from "zod";

export const garantiaSchema = z.object({
  obraId: z.string().min(1, "Obra obrigatória"),
  clienteId: z.string().min(1, "Cliente obrigatório"),
  dataInicio: z.string().min(1, "Data de início obrigatória"),
  dataFim: z.string().min(1, "Data de fim obrigatória"),
  prazoMeses: z.number().int().positive("Prazo deve ser maior que zero"),
  tipoGarantia: z.string().min(2, "Tipo de garantia obrigatório"),
  condicoes: z.string().optional().or(z.literal("")),
  status: z.enum(["ATIVA", "EXPIRADA", "ACIONADA"]).default("ATIVA"),
});

export type GarantiaInput = z.infer<typeof garantiaSchema>;
