import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      clienteId?: string;
      clienteNome?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    clienteId?: string;
    clienteNome?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    clienteId?: string;
    clienteNome?: string;
  }
}
