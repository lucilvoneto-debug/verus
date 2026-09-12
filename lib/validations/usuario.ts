import { z } from "zod";
import { PAPEIS } from "@/lib/permissions";

export const usuarioSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  role: z.enum(PAPEIS),
  active: z.boolean().default(true),
  password: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
});

export type UsuarioInput = z.infer<typeof usuarioSchema>;
