import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { podeEscrever, podeExcluir, podeLer, type Modulo } from "./permissions";

export type SessaoUsuario = { id: string; name?: string | null; email?: string | null; role: string };

/** Sessão admin (NextAuth) ou null. */
export async function sessaoAtual(): Promise<SessaoUsuario | null> {
  const s = await getServerSession(authOptions);
  const u = s?.user as (SessaoUsuario & { id?: string }) | undefined;
  if (!u?.id) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

type Acao = "ler" | "escrever" | "excluir";

/**
 * Para rotas que precisam checar além do middleware (ex.: rota pública
 * por prefixo mas com ação sensível). Devolve a sessão ou uma resposta 401/403.
 */
export async function exigir(
  modulo: Modulo,
  acao: Acao = "escrever",
): Promise<{ sessao: SessaoUsuario; erro?: undefined } | { sessao?: undefined; erro: NextResponse }> {
  const sessao = await sessaoAtual();
  if (!sessao) return { erro: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  const ok =
    acao === "ler"
      ? podeLer(sessao.role, modulo)
      : acao === "excluir"
        ? podeExcluir(sessao.role)
        : podeEscrever(sessao.role, modulo);
  if (!ok) return { erro: NextResponse.json({ error: "Sem permissão" }, { status: 403 }) };
  return { sessao };
}
