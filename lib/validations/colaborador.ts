import { z } from "zod";

export const FUNCOES_COLABORADOR = [
  "APLICADOR",
  "AJUDANTE",
  "TECNICO",
  "ENGENHEIRO",
  "SUPERVISOR",
  "VENDEDOR",
  "ADMINISTRATIVO",
  "MOTORISTA",
] as const;

export const colaboradorSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cpf: z.string().min(11, "CPF inválido").transform((v) => v.replace(/\D+/g, "")),
  telefone: z.string().optional().or(z.literal("")),
  funcao: z.string().min(2, "Função obrigatória"),
  custoHora: z.coerce.number().min(0).default(0),
  custoDia: z.coerce.number().min(0).default(0),
  disponivel: z.boolean().default(true),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional().or(z.literal("")),
  /** id de User para vincular login (opcional). "" ou null desvincula. */
  userId: z.string().nullable().optional().or(z.literal("")),
});

export type ColaboradorInput = z.infer<typeof colaboradorSchema>;
