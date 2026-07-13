import { z } from "zod";

export const fabricanteSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  ativo: z.boolean().default(true),
  catalogoSincronizado: z.boolean().default(false),
  fichaTecnicaUrl: z.string().optional().or(z.literal("")),
  fispqUrl: z.string().optional().or(z.literal("")),
  normasTecnicas: z.string().optional().or(z.literal("")),
  garantiaAnosPadrao: z.number().int().positive().optional().nullable(),
  observacoes: z.string().optional().or(z.literal("")),
});

export type FabricanteInput = z.infer<typeof fabricanteSchema>;
