import { z } from "zod";

export const medicaoSchema = z.object({
  obraId: z.string().min(1, "Obra obrigatória"),
  dataReferencia: z.string().min(1, "Data de referência obrigatória"),
  percentualExecutado: z.coerce.number().min(0).max(100),
  valor: z.coerce.number().min(0),
  observacoes: z.string().optional().or(z.literal("")),
});

export type MedicaoInput = z.infer<typeof medicaoSchema>;
