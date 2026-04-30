import { z } from "zod";

export const fornecedorSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  cnpj: z.string().min(11, "CNPJ inválido"),
  contato: z.string().optional().or(z.literal("")),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  endereco: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
  ativo: z.boolean().default(true),
});

export type FornecedorInput = z.infer<typeof fornecedorSchema>;
