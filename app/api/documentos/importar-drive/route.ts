export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DOC_ENTIDADE } from "@/app/api/documentos/route";

interface ImportItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string | number;
}

/**
 * POST /api/documentos/importar-drive
 * body: { files: ImportItem[] }
 * Cria um Anexo por arquivo do Drive (referência via proxy). Não recopia bytes;
 * a abertura passa por /api/integracoes/google/drive?download=<fileId>.
 * Deduplica por (entidade, entidadeId=fileId).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  let userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    userId = admin.id;
  }

  const body = (await req.json().catch(() => ({}))) as { files?: ImportItem[] };
  const files = Array.isArray(body.files) ? body.files.filter((f) => f?.id && f?.name) : [];
  if (files.length === 0) {
    return NextResponse.json({ error: "Nenhum arquivo informado" }, { status: 400 });
  }

  const existentes = await prisma.anexo.findMany({
    where: { entidade: DOC_ENTIDADE, entidadeId: { in: files.map((f) => f.id) } },
    select: { entidadeId: true },
  });
  const jaTem = new Set(existentes.map((e) => e.entidadeId));

  const novos = files.filter((f) => !jaTem.has(f.id));
  if (novos.length > 0) {
    await prisma.anexo.createMany({
      data: novos.map((f) => ({
        entidade: DOC_ENTIDADE,
        entidadeId: f.id,
        nome: f.name,
        url: `/api/integracoes/google/drive?download=${encodeURIComponent(f.id)}`,
        tipo: f.mimeType || "application/octet-stream",
        tamanho: Number(f.size) || 0,
        uploadedById: userId,
      })),
    });
  }

  return NextResponse.json({
    ok: true,
    importados: novos.length,
    ignorados: files.length - novos.length,
  });
}
