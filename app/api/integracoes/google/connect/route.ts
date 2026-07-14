export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { driveRedirectUri } from "@/lib/google/oauth";

/**
 * GET /api/integracoes/google/connect
 * Inicia o OAuth do Google Drive (escopo somente-leitura). Após o "Permitir",
 * o callback grava o refresh_token em Configuracao. Só para usuário logado.
 */
const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
];

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { id?: string } | undefined)?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = driveRedirectUri(req);
  if (!clientId) {
    return NextResponse.json(
      {
        error: "GOOGLE_OAUTH_CLIENT_ID não configurado no Vercel",
        como: "Crie um OAuth 2.0 Client ID (tipo Web) em https://console.cloud.google.com/apis/credentials e registre o redirect_uri abaixo.",
        redirect_uri: redirectUri,
      },
      { status: 503 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", redirectUri);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", SCOPES.join(" "));
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("state", state);

  const res = NextResponse.redirect(auth.toString());
  res.cookies.set("gdrive_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
