/**
 * POST multipart/form-data { file, contexto? } → { id, url, mime, tamanho }
 *
 * Prefixo /api/foto é liberado no middleware (o GET precisa ser público para
 * o link de obra/proposta), então a autenticação do upload é feita aqui:
 * sessão admin (ERP/campo) ou sessão de cliente do portal.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { salvarArquivo, MAX_BYTES } from "@/lib/storage";

const CONTEXTOS = new Set(["diario", "etapa", "visita", "anexo", "whatsapp", "chamado", "atendimento", "comprovante", "geral"]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const cliente = req.cookies.get("verus-cliente.session-token") ?? req.cookies.get("__Secure-verus-cliente.session-token");
  if (!userId && !cliente) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES * 1.1) {
    return NextResponse.json({ error: "Arquivo grande demais" }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Envie multipart/form-data com o campo file" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Campo file ausente" }, { status: 400 });
  }
  const contextoRaw = String(form.get("contexto") ?? "geral");
  const contexto = CONTEXTOS.has(contextoRaw) ? contextoRaw : "geral";

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const salvo = await salvarArquivo({
      bytes,
      mime: file.type || "application/octet-stream",
      nome: file.name,
      contexto,
      userId,
    });
    return NextResponse.json({ ...salvo, nome: file.name }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Falha ao salvar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
