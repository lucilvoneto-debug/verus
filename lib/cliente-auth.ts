import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const clienteAuthOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/portal/login" },
  providers: [
    CredentialsProvider({
      id: "cliente-credentials",
      name: "cliente-credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const acesso = await prisma.clienteAcesso.findUnique({
          where: { email: credentials.email },
          include: { cliente: { select: { id: true, nome: true } } },
        });
        if (!acesso || !acesso.ativo) return null;
        const ok = await bcrypt.compare(credentials.password, acesso.passwordHash);
        if (!ok) return null;

        await prisma.clienteAcesso.update({
          where: { id: acesso.id },
          data: { ultimoLogin: new Date() },
        });

        return {
          id: acesso.id,
          email: acesso.email,
          name: acesso.cliente.nome,
          role: "CLIENTE",
          clienteId: acesso.cliente.id,
          clienteNome: acesso.cliente.nome,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = "CLIENTE";
        const u = user as { clienteId?: string; clienteNome?: string };
        if (u.clienteId) token.clienteId = u.clienteId;
        if (u.clienteNome) token.clienteNome = u.clienteNome;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "CLIENTE";
        if (token.clienteId) session.user.clienteId = token.clienteId as string;
        if (token.clienteNome) session.user.clienteNome = token.clienteNome as string;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}verus-cliente.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}verus-cliente.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      name: `${useSecureCookies ? "__Host-" : ""}verus-cliente.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const CLIENTE_SESSION_COOKIE = `${cookiePrefix}verus-cliente.session-token`;
