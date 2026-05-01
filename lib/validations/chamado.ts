import { z } from "zod";

export const chamadoSchema = z.object({
  garantiaId: z.string().min(1, "Garantia obrigatória"),
  clienteId: z.string().min(1, "Cliente obrigatório"),
  descricao: z.string().min(2, "Descrição obrigatória"),
  fotos: z.array(z.string()).optional().default([]),
  tecnicoId: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

export type ChamadoInput = z.infer<typeof chamadoSchema>;
