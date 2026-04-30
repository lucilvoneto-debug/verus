import { z } from "zod";

export const obraSchema = z.object({
  contratoId: z.string().min(1, "Contrato obrigatório"),
  clienteId: z.string().min(1, "Cliente obrigatório"),
  nome: z.string().min(2, "Nome obrigatório"),
  endereco: z.string().min(5, "Endereço obrigatório"),
  responsavelId: z.string().min(1, "Responsável obrigatório"),
  dataInicio: z.string().min(1, "Data de início obrigatória"),
  previsaoTermino: z.string().min(1, "Previsão obrigatória"),
  status: z
    .enum(["AGUARDANDO", "EM_ANDAMENTO", "PAUSADA", "ATRASADA", "FINALIZADA", "CANCELADA"])
    .default("AGUARDANDO"),
  observacoes: z.string().optional().or(z.literal("")),
});

export type ObraInput = z.infer<typeof obraSchema>;

export const obraStatusSchema = z.object({
  status: z.enum(["AGUARDANDO", "EM_ANDAMENTO", "PAUSADA", "ATRASADA", "FINALIZADA", "CANCELADA"]),
});

export const diarioObraSchema = z.object({
  data: z.string().min(1, "Data obrigatória"),
  descricao: z.string().min(2, "Descrição obrigatória"),
  condicaoTempo: z.string().optional().or(z.literal("")),
  problemas: z.string().optional().or(z.literal("")),
  autorId: z.string().optional().or(z.literal("")),
});

export type DiarioObraInput = z.infer<typeof diarioObraSchema>;

export const alocacaoEquipeSchema = z.object({
  colaboradorId: z.string().min(1, "Colaborador obrigatório"),
  papel: z.string().min(2, "Papel obrigatório"),
  dataInicio: z.string().min(1, "Data início obrigatória"),
  dataFim: z.string().optional().or(z.literal("")),
});

export type AlocacaoEquipeInput = z.infer<typeof alocacaoEquipeSchema>;
