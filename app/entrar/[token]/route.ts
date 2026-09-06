import { NextRequest, NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Atalho de acesso por link secreto.
 *
 * Só existe quando `ACESSO_DIRETO_TOKEN` está configurado no ambiente — sem a
 * variável a rota responde 404 e nada muda. Com ela, abrir
 * `/entrar/<token>` cria a sessão do primeiro admin ativo e cai no dashboard,
 * sem passar pela tela de login. Para desligar, basta remover a variável.
 */

const COOKIE_PADRAO = "next-auth.session-token";
const COOKIE_SEGURO = "__Secure-next-auth.session-token";
const DIAS = 30;
const TAMANHO_MINIMO = 32;

function iguais(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const esperado = process.env.ACESSO_DIRETO_TOKEN;
  const segredo = process.env.NEXTAUTH_SECRET;

  if (!esperado || esperado.length < TAMANHO_MINIMO || !segredo) {
    return new NextResponse(null, { status: 404 });
  }
  if (!iguais(params.token, esperado)) {
    return new NextResponse(null, { status: 404 });
  }

  // A sessão precisa de um usuário real: `session.user.id` vira chave
  // estrangeira em check-in, consumo e assinatura de obra.
  const user =
    (await prisma.user.findFirst({
      where: { active: true, role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.user.findFirst({ where: { active: true }, orderBy: { createdAt: "asc" } }));

  if (!user) {
    return NextResponse.json(
      { error: "Nenhum usuário ativo no banco — não há conta para abrir a sessão." },
      { status: 503 },
    );
  }

  const maxAge = DIAS * 24 * 60 * 60;
  const jwt = await encode({
    secret: segredo,
    maxAge,
    token: {
      id: user.id,
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });

  const https = req.nextUrl.protocol === "https:";
  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  const opcoes = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: https,
    path: "/",
    maxAge,
  };
  // Os dois nomes: o `__Secure-` é o que o NextAuth usa em https, o outro em http.
  res.cookies.set(COOKIE_PADRAO, jwt, opcoes);
  if (https) res.cookies.set(COOKIE_SEGURO, jwt, opcoes);
  return res;
}
