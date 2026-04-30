import { z } from "zod";

export const orcamentoItemSchema = z.object({
  servicoId: z.string().min(1, "Serviço obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  area: z.number().optional().nullable(),
  quantidade: z.number().positive("Quantidade obrigatória"),
  unidade: z.string(),
  custoUnit: z.number().nonnegative(),
  precoUnit: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

export const orcamentoSchema = z.object({
  clienteId: z.string().min(1, "Cliente obrigatório"),
  visitaId: z.string().optional().or(z.literal("")),
  vendedorId: z.string().min(1, "Vendedor obrigatório"),
  dataValidade: z.string().min(1, "Validade obrigatória"),
  status: z.enum(["RASCUNHO", "ENVIADO", "APROVADO", "RECUSADO", "VENCIDO"]).default("RASCUNHO"),
  desconto: z.number().nonnegative().default(0),
  condicaoPagamento: z.string().optional().or(z.literal("")),
  prazoExecucao: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
  itens: z.array(orcamentoItemSchema).min(1, "Inclua ao menos um item"),
});

export type OrcamentoInput = z.infer<typeof orcamentoSchema>;
export type OrcamentoItemInput = z.infer<typeof orcamentoItemSchema>;
