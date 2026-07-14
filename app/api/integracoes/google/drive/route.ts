export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoogleAccessToken } from "@/lib/google/oauth";

/**
 * GET /api/integracoes/google/drive
 *   ?status=1                 → { connected, email? }
 *   ?folderId=<id|root>       → { folders[], files[], breadcrumb? }  (listar)
 *   ?download=<fileId>        → stream do arquivo (proxy, sem cópia)
 *
 * Escopo somente-leitura. Todas as rotas exigem sessão de staff.
 */
const FOLDER_MIME = "application/vnd.google-apps.folder";

/** Google-nativos (Docs/Sheets/Slides) precisam de export; mapeia pra formato baixável. */
const EXPORT_MAP: Record<string, { mime: string; ext: string }> = {
  "application/vnd.google-apps.document": {
    mime: "application/pdf",
    ext: "pdf",
  },
  "application/vnd.google-apps.spreadsheet": {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mime: "application/pdf",
    ext: "pdf",
  },
  "application/vnd.google-apps.drawing": { mime: "image/png", ext: "png" },
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  iconLink?: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { id?: string } | undefined)?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const token = await getGoogleAccessToken();
  const url = new URL(req.url);

  // --- status ---
  if (url.searchParams.get("status")) {
    if (!token) return NextResponse.json({ connected: false });
    try {
      const r = await fetch(
        "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName)",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return NextResponse.json({ connected: false });
      return NextResponse.json({
        connected: true,
        email: j?.user?.emailAddress ?? null,
        nome: j?.user?.displayName ?? null,
      });
    } catch {
      return NextResponse.json({ connected: false });
    }
  }

  if (!token) {
    return NextResponse.json(
      { error: "Google Drive não conectado", connected: false },
      { status: 409 }
    );
  }

  // --- download (proxy) ---
  const downloadId = url.searchParams.get("download");
  if (downloadId) {
    const meta = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        downloadId
      )}?fields=id,name,mimeType&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!meta.ok) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: meta.status });
    }
    const m: DriveFile = await meta.json();
    let src: Response;
    let filename = m.name;
    let contentType = m.mimeType;

    const exp = EXPORT_MAP[m.mimeType];
    if (exp) {
      src = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          downloadId
        )}/export?mimeType=${encodeURIComponent(exp.mime)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      contentType = exp.mime;
      if (!/\.[a-z0-9]+$/i.test(filename)) filename = `${filename}.${exp.ext}`;
    } else {
      src = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          downloadId
        )}?alt=media&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    if (!src.ok || !src.body) {
      return NextResponse.json({ error: "Falha ao baixar do Drive" }, { status: 502 });
    }
    return new Response(src.body, {
      headers: {
        "Content-Type": contentType || "application/octet-stream",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, max-age=0",
      },
    });
  }

  // --- listar pasta ---
  const folderId = url.searchParams.get("folderId") || "root";
  const q = `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`;
  const params = new URLSearchParams({
    q,
    fields: "files(id,name,mimeType,size,modifiedTime,iconLink)",
    orderBy: "folder,name",
    pageSize: "200",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const r = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    return NextResponse.json(
      { error: e?.error?.message || "Falha ao listar o Drive" },
      { status: r.status }
    );
  }
  const j: { files?: DriveFile[] } = await r.json();
  const all = j.files ?? [];
  const folders = all.filter((f) => f.mimeType === FOLDER_MIME);
  const files = all.filter((f) => f.mimeType !== FOLDER_MIME);
  return NextResponse.json({ folderId, folders, files });
}
