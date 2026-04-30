import { z } from "zod";

export const contratoSchema = z.object({
  orcamentoId: z.string().min(1, "Orçamento obrigatório"),
  clienteId: z.string().min(1, "Cliente obrigatório"),
  valor: z.number().nonnegative(),
  condicaoPagamento: z.string().min(1, "Condição obrigatória"),
  prazoExecucao: z.string().min(1, "Prazo obrigatório"),
  garantiaMeses: z.number().int().nonnegative().default(60),
  escopo: z.string().min(2, "Escopo obrigatório"),
  obrigacoesCliente: z.string().optional().or(z.literal("")),
  obrigacoesEmpresa: z.string().optional().or(z.literal("")),
  clausulasExtras: z.string().optional().or(z.literal("")),
});

export type ContratoInput = z.infer<typeof contratoSchema>;
