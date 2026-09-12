import { z } from "zod";

export const leadPublicoSchema = z.object({
  nome: z.string().min(2, "Informe seu nome").max(120),
  telefone: z.string().min(10, "Telefone inválido").max(20),
  email: z.string().email().optional().or(z.literal("")),
  cidade: z.string().max(80).optional(),
  bairro: z.string().max(80).optional(),
  tipoImovel: z.string().max(30).optional(),
  descricao: z.string().min(3, "Conte o problema").max(2000),
  // rastreio
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  fbc: z.string().max(200).optional(),
  fbp: z.string().max(200).optional(),
  landingPage: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  // honeypot — bot preenche, humano não vê
  site: z.string().max(0).optional(),
});

export const leadManualSchema = z.object({
  nome: z.string().min(2).max(120),
  telefone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  cidade: z.string().max(80).optional(),
  bairro: z.string().max(80).optional(),
  tipoImovel: z.string().max(30).optional(),
  origem: z.string().min(2).max(30),
  descricao: z.string().min(1).max(2000),
  urgencia: z.enum(["BAIXA", "MEDIA", "ALTA"]).optional(),
  valorEstimado: z.coerce.number().nonnegative().optional(),
  responsavelId: z.string().optional().or(z.literal("")),
  clienteId: z.string().optional().or(z.literal("")),
});

export const leadPatchSchema = z.object({
  nome: z.string().max(120).nullable().optional(),
  telefone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  cidade: z.string().max(80).nullable().optional(),
  bairro: z.string().max(80).nullable().optional(),
  tipoImovel: z.string().max(30).nullable().optional(),
  origem: z.string().max(30).optional(),
  descricao: z.string().max(2000).optional(),
  urgencia: z.enum(["BAIXA", "MEDIA", "ALTA"]).optional(),
  status: z.string().max(30).optional(),
  motivoPerda: z.string().max(60).nullable().optional(),
  valorEstimado: z.coerce.number().nonnegative().nullable().optional(),
  valorFechado: z.coerce.number().nonnegative().nullable().optional(),
  responsavelId: z.string().nullable().optional(),
  clienteId: z.string().nullable().optional(),
  proximaAcao: z.string().max(200).nullable().optional(),
  dataProximaAcao: z.string().datetime().nullable().optional().or(z.literal("")),
});

export type LeadPublicoInput = z.infer<typeof leadPublicoSchema>;
export type LeadManualInput = z.infer<typeof leadManualSchema>;
