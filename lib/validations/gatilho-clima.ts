import { z } from "zod";

export const gatilhoSchema = z.object({
  cidade: z.string().min(2, "Cidade obrigatória"),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  ativo: z.boolean().default(true),
  limiarChuvaMm: z.coerce.number().min(1).default(10),
  cooldownDias: z.coerce.number().int().min(1).default(15),
  mensagem: z.string().min(10, "Mensagem muito curta"),
});

export type GatilhoInput = z.infer<typeof gatilhoSchema>;

export const MSG_CLIMA_PADRAO =
  "Olá {nome}! Choveu forte em {cidade} ({chuva} mm). Se apareceu alguma infiltração ou mancha, " +
  "a Verus faz uma vistoria sem compromisso — é só responder aqui. 🌧️";
