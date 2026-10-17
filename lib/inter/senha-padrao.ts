import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * O seed antigo criou admin@verus.com.br com a senha "admin123", que ficou escrita na tela
 * de login até 17/10/2026. Enquanto algum usuário ativo tiver essa senha, nada que mexe
 * com o banco (ligar o Inter, mandar pagamento) funciona.
 */
export async function senhaPadraoAtiva(): Promise<boolean> {
  const usuarios = await prisma.user.findMany({ where: { active: true }, select: { passwordHash: true } });
  for (const u of usuarios) if (await bcrypt.compare("admin123", u.passwordHash)) return true;
  return false;
}

export const AVISO_SENHA_PADRAO =
  "Antes de ligar o banco, troque a senha do administrador em Usuários: ela ainda é a senha de demonstração (admin123), que ficou escrita na tela de entrada.";
