import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendMessage } from "@/lib/integrations/whatsapp";

export const dynamic = "force-dynamic";

const schema = z.object({
  telefone: z.string().min(8, "Telefone inválido"),
  mensagem: z.string().min(1, "Mensagem vazia"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const result = await sendMessage(parsed.data.telefone, parsed.data.mensagem);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
