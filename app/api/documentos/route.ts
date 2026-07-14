export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Entidade usada nos Anexos importados do Drive. */
export const DOC_ENTIDADE = "Documento";

/** GET /api/documentos → lista documentos importados (Anexo entidade="Documento"). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { id?: string } | undefined)?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const docs = await prisma.anexo.findMany({
    where: { entidade: DOC_ENTIDADE },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      url: true,
      tipo: true,
      tamanho: true,
      entidadeId: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ docs });
}

/** DELETE /api/documentos?id=<anexoId> → remove só a referência no ERP (não toca no Drive). */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as { id?: string } | undefined)?.id) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ausente" }, { status: 400 });
  await prisma.anexo.deleteMany({ where: { id, entidade: DOC_ENTIDADE } });
  return NextResponse.json({ ok: true });
}
