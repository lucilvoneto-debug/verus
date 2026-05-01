import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const itemSchema = z.object({
  chave: z.string().min(1),
  valor: z.string(),
  descricao: z.string().optional().nullable(),
});

const putSchema = z.union([
  itemSchema,
  z.object({ items: z.array(itemSchema).min(1) }),
]);

export async function GET() {
  const configs = await prisma.configuracao.findMany({ orderBy: { chave: "asc" } });
  return NextResponse.json({ data: configs });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const items =
    "items" in parsed.data ? parsed.data.items : [parsed.data];

  const results = await Promise.all(
    items.map((item) =>
      prisma.configuracao.upsert({
        where: { chave: item.chave },
        update: { valor: item.valor, descricao: item.descricao ?? undefined },
        create: {
          chave: item.chave,
          valor: item.valor,
          descricao: item.descricao ?? undefined,
        },
      })
    )
  );

  return NextResponse.json({ data: results });
}
