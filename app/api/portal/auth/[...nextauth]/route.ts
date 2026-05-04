import NextAuth from "next-auth";
import { clienteAuthOptions } from "@/lib/cliente-auth";

const handler = NextAuth(clienteAuthOptions);
export { handler as GET, handler as POST };
