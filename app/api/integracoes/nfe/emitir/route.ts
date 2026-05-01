import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { emitirNFE } from "@/lib/integrations/nfe";

export const dynamic = "force-dynamic";

const schema = z.object({
  obraId: z.string().min(1),
  medicaoId: z.string().nullish(),
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
  const result = await emitirNFE({
    obraId: parsed.data.obraId,
    medicaoId: parsed.data.medicaoId ?? null,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
