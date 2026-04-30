import { z } from "zod";

export const contaReceberSchema = z.object({
  clienteId: z.string().min(1, "Cliente obrigatório"),
  contratoId: z.string().optional().or(z.literal("")),
  obraId: z.string().optional().or(z.literal("")),
  descricao: z.string().min(2, "Descrição obrigatória"),
  valor: z.number().nonnegative(),
  vencimento: z.string().min(1, "Vencimento obrigatório"),
  status: z.enum(["ABERTA", "PAGA", "ATRASADA", "PARCIAL"]).default("ABERTA"),
  observacoes: z.string().optional().or(z.literal("")),
});

export type ContaReceberInput = z.infer<typeof contaReceberSchema>;

export const receberSchema = z.object({
  valorPago: z.number().positive("Valor obrigatório"),
  formaPagamento: z.string().min(1, "Forma de pagamento obrigatória"),
  comprovanteUrl: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

export type ReceberInput = z.infer<typeof receberSchema>;
