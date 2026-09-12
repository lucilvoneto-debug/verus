export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gatilhoSchema } from "@/lib/validations/gatilho-clima";
import { geocodeEndereco } from "@/lib/geocode";
import { chuvaRecente } from "@/lib/pos-venda";


/** GET → gatilhos com chuva atual (best-effort) e contagem de disparos. */
export async function GET(req: NextRequest) {
  const comClima = new URL(req.url).searchParams.get("clima") === "1";
  const rows = await prisma.gatilhoTemporal.findMany({ orderBy: [{ ativo: "desc" }, { cidade: "asc" }] });
  const contagens = await prisma.disparoTemporal.groupBy({ by: ["gatilhoId"], _count: { _all: true } });
  const porGatilho: Record<string, number> = {};
  contagens.forEach((c) => (porGatilho[c.gatilhoId] = c._count._all));
  const clientesPorCidade = await prisma.cliente.groupBy({ by: ["cidade"], _count: { _all: true } });
  const carteira: Record<string, number> = {};
  clientesPorCidade.forEach((c) => (carteira[(c.cidade ?? "").toLowerCase()] = c._count._all));

  const data = await Promise.all(
    rows.map(async (g) => {
      let clima: { ontem: number; hoje: number } | null = null;
      if (comClima) {
        try {
          clima = await chuvaRecente(g.lat, g.lng);
        } catch {
          clima = null;
        }
      }
      return { ...g, disparos: porGatilho[g.id] ?? 0, clientesNaCidade: carteira[g.cidade.toLowerCase()] ?? 0, clima };
    }),
  );
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const parsed = gatilhoSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  let lat = d.lat;
  let lng = d.lng;
  if (lat === undefined || lng === undefined) {
    const geo = await geocodeEndereco(d.cidade);
    if (!geo) return NextResponse.json({ error: "Não achei coordenadas para essa cidade. Informe lat/lng." }, { status: 400 });
    lat = geo.lat;
    lng = geo.lng;
  }
  const g = await prisma.gatilhoTemporal.create({
    data: { cidade: d.cidade, lat, lng, ativo: d.ativo, limiarChuvaMm: d.limiarChuvaMm, cooldownDias: d.cooldownDias, mensagem: d.mensagem },
  });
  return NextResponse.json(g, { status: 201 });
}
