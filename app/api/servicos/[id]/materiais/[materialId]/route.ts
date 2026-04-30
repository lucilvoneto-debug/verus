import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; materialId: string } }
) {
  await prisma.servicoMaterial.deleteMany({
    where: { servicoId: params.id, materialId: params.materialId },
  });
  return NextResponse.json({ ok: true });
}
