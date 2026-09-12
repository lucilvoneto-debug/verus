export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeEndereco } from "@/lib/geocode";
import { gatilhoSchema } from "@/lib/validations/gatilho-clima";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const parsed = gatilhoSchema.partial().safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  let coords: { lat: number; lng: number } | null = null;
  if (d.cidade && (d.lat === undefined || d.lng === undefined)) {
    const geo = await geocodeEndereco(d.cidade);
    if (geo) coords = { lat: geo.lat, lng: geo.lng };
  }
  const g = await prisma.gatilhoTemporal.update({
    where: { id: params.id },
    data: {
      ...(d.cidade !== undefined ? { cidade: d.cidade } : {}),
      ...(d.lat !== undefined ? { lat: d.lat } : coords ? { lat: coords.lat } : {}),
      ...(d.lng !== undefined ? { lng: d.lng } : coords ? { lng: coords.lng } : {}),
      ...(d.ativo !== undefined ? { ativo: d.ativo } : {}),
      ...(d.limiarChuvaMm !== undefined ? { limiarChuvaMm: d.limiarChuvaMm } : {}),
      ...(d.cooldownDias !== undefined ? { cooldownDias: d.cooldownDias } : {}),
      ...(d.mensagem !== undefined ? { mensagem: d.mensagem } : {}),
    },
  });
  return NextResponse.json(g);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.disparoTemporal.deleteMany({ where: { gatilhoId: params.id } });
  await prisma.gatilhoTemporal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
