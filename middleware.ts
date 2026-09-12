import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { autorizaRota, moduloDaRota } from "@/lib/permissions";

const ADMIN_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];
const CLIENTE_COOKIE_NAMES = [
  "verus-cliente.session-token",
  "__Secure-verus-cliente.session-token",
];

function hasAnyCookie(req: NextRequest, names: string[]): boolean {
  return names.some((n) => Boolean(req.cookies.get(n)?.value));
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // /portal/* (não-/portal/login) e /api/portal/* (não-auth)
  const isPortalPath =
    (pathname.startsWith("/portal") && pathname !== "/portal/login") ||
    (pathname.startsWith("/api/portal") && !pathname.startsWith("/api/portal/auth"));

  if (isPortalPath) {
    const hasCookie = hasAnyCookie(req, CLIENTE_COOKIE_NAMES);
    if (!hasCookie) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/portal/login";
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    // Cookie presente — confia no NextAuth handler para validação real
    return NextResponse.next();
  }

  // Públicos: webhooks (Meta valida por assinatura) e formulário de lead do site.
  const isPublicApi =
    pathname.startsWith("/api/webhooks/") ||
    (pathname === "/api/leads" && req.method === "POST");
  if (isPublicApi) return NextResponse.next();

  // /dashboard/*, /campo/* e /api/* (não-auth, não-cron, não-portal) — sessão admin
  const needsAdmin =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/campo") ||
    (pathname.startsWith("/api/") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/cron") &&
      !pathname.startsWith("/api/mobile") &&
      !pathname.startsWith("/api/foto") &&
      !pathname.startsWith("/api/mp") &&
      !pathname.startsWith("/api/proposta") &&
      !pathname.startsWith("/api/obra/") &&
      !pathname.startsWith("/api/portal"));

  if (needsAdmin) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }

    // Matriz papel × módulo (lib/permissions.ts). GET = ler; resto = escrever.
    const papel = typeof token.role === "string" ? token.role : undefined;
    if (!autorizaRota(papel, pathname, req.method)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Sem permissão para esta ação", modulo: moduloDaRota(pathname) },
          { status: 403 },
        );
      }
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      url.searchParams.set("negado", moduloDaRota(pathname) ?? "");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/campo/:path*",
    "/portal/:path*",
    "/api/((?!auth|cron).*)",
  ],
};
