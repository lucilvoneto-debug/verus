export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { DRIVE_CONFIG_KEY, driveRedirectUri, setConfigValor } from "@/lib/google/oauth";

/**
 * GET /api/integracoes/google/callback
 * Recebe o `code`, troca por refresh_token e salva em Configuracao.
 * Redireciona de volta para o módulo Documentos.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const back = new URL("/dashboard/documentos", url.origin);

  const err = url.searchParams.get("error");
  if (err) {
    back.searchParams.set("drive_error", err);
    return NextResponse.redirect(back);
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const cookieState = req.cookies.get("gdrive_oauth_state")?.value;
  if (!code) {
    back.searchParams.set("drive_error", "code ausente");
    return NextResponse.redirect(back);
  }
  if (!cookieState || state !== cookieState) {
    back.searchParams.set("drive_error", "state inválido (CSRF)");
    return NextResponse.redirect(back);
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    back.searchParams.set("drive_error", "GOOGLE_OAUTH_CLIENT_ID/SECRET não configurados");
    return NextResponse.redirect(back);
  }

  try {
    const tk = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: driveRedirectUri(req),
        grant_type: "authorization_code",
      }),
    });
    const tj: { refresh_token?: string; error_description?: string; error?: string } =
      await tk.json();
    if (!tk.ok || !tj.refresh_token) {
      back.searchParams.set("drive_error", tj.error_description || tj.error || "sem refresh_token");
      return NextResponse.redirect(back);
    }

    await setConfigValor(DRIVE_CONFIG_KEY, tj.refresh_token, "Refresh token do Google Drive");

    back.searchParams.set("drive_ok", "1");
    const res = NextResponse.redirect(back);
    res.cookies.delete("gdrive_oauth_state");
    return res;
  } catch (e) {
    back.searchParams.set("drive_error", e instanceof Error ? e.message : "erro");
    return NextResponse.redirect(back);
  }
}
