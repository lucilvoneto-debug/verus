import { z } from "zod";

export const itemCompraSchema = z.object({
  materialId: z.string().min(1),
  quantidade: z.number().positive(),
  custoUnit: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

export const pedidoCompraSchema = z.object({
  fornecedorId: z.string().min(1, "Fornecedor obrigatório"),
  dataPedido: z.string().min(1, "Data obrigatória"),
  dataPrevista: z.string().min(1, "Previsão obrigatória"),
  observacoes: z.string().optional().or(z.literal("")),
  itens: z.array(itemCompraSchema).min(1, "Adicione ao menos um item"),
});

export type PedidoCompraInput = z.infer<typeof pedidoCompraSchema>;
export type ItemCompraInput = z.infer<typeof itemCompraSchema>;
