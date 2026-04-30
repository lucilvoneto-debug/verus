import { z } from "zod";

export const contaPagarSchema = z.object({
  fornecedorId: z.string().optional().or(z.literal("")),
  categoria: z.string().min(1, "Categoria obrigatória"),
  descricao: z.string().min(2, "Descrição obrigatória"),
  valor: z.number().nonnegative(),
  vencimento: z.string().min(1, "Vencimento obrigatório"),
  status: z.enum(["ABERTA", "PAGA", "ATRASADA", "PARCIAL"]).default("ABERTA"),
  observacoes: z.string().optional().or(z.literal("")),
});

export type ContaPagarInput = z.infer<typeof contaPagarSchema>;

export const pagarSchema = z.object({
  valorPago: z.number().positive("Valor obrigatório"),
  formaPagamento: z.string().min(1, "Forma de pagamento obrigatória"),
  comprovanteUrl: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

export type PagarInput = z.infer<typeof pagarSchema>;
