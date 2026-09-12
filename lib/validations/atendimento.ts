import { z } from "zod";

export const CANAIS_ATENDIMENTO = ["WHATSAPP", "TELEFONE", "EMAIL", "SITE", "PRESENCIAL", "INDICACAO", "PORTAL"] as const;
export const URGENCIAS = ["BAIXA", "MEDIA", "ALTA"] as const;
export const STATUS_ATENDIMENTO = ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO_CLIENTE", "RESOLVIDO", "CANCELADO"] as const;

export const atendimentoSchema = z.object({
  clienteId: z.string().min(1, "Cliente obrigatório"),
  leadId: z.string().optional().nullable().or(z.literal("")),
  canal: z.enum(CANAIS_ATENDIMENTO),
  descricao: z.string().min(3, "Descreva o atendimento"),
  urgencia: z.enum(URGENCIAS).default("MEDIA"),
  status: z.enum(STATUS_ATENDIMENTO).default("ABERTO"),
  responsavelId: z.string().min(1, "Responsável obrigatório"),
  fotos: z.array(z.string()).optional(),
});

export type AtendimentoInput = z.infer<typeof atendimentoSchema>;

export const CANAL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  TELEFONE: "Telefone",
  EMAIL: "E-mail",
  SITE: "Site",
  PRESENCIAL: "Presencial",
  INDICACAO: "Indicação",
  PORTAL: "Portal do cliente",
};

export const STATUS_ATEND_LABEL: Record<string, string> = {
  ABERTO: "Aberto",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  RESOLVIDO: "Resolvido",
  CANCELADO: "Cancelado",
};
