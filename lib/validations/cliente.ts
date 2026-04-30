import { z } from "zod";

export const clienteSchema = z.object({
  tipo: z.enum(["PF", "PJ"]),
  nome: z.string().min(2, "Nome obrigatório"),
  documento: z.string().min(11, "Documento inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  whatsapp: z.string().optional().or(z.literal("")),
  cep: z.string().optional().or(z.literal("")),
  logradouro: z.string().optional().or(z.literal("")),
  numero: z.string().optional().or(z.literal("")),
  complemento: z.string().optional().or(z.literal("")),
  bairro: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  uf: z.string().max(2).optional().or(z.literal("")),
  categoria: z.enum(["RESIDENCIAL", "CONDOMINIO", "CONSTRUTORA", "EMPRESA", "INDUSTRIA"]),
  observacoes: z.string().optional().or(z.literal("")),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
