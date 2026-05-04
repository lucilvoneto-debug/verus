import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeEndereco } from "@/lib/geocode";
import { getForecast, pickDay, type WeatherDay } from "@/lib/weather";

export const dynamic = "force-dynamic";

export type AgendaItemTipo = "VISITA" | "OBRA_INICIO" | "OBRA_FIM" | "ETAPA";

export interface AgendaItem {
  id: string;
  tipo: AgendaItemTipo;
  titulo: string;
  data: string; // ISO
  endereco: string | null;
  cliente: string | null;
  responsavel: string | null;
  status: string | null;
  weather: WeatherDay | null;
  href?: string;
}

function toISODate(d: Date): string {
  // YYYY-MM-DD em America/Sao_Paulo. As datas do banco são UTC; aqui só
  // pegamos a porção de data via toLocaleDateString.
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

async function attachWeather(items: AgendaItem[]): Promise<AgendaItem[]> {
  // Agrupa por endereço para minimizar geocodings.
  const enderecoToItems = new Map<string, AgendaItem[]>();
  for (const it of items) {
    if (!it.endereco) continue;
    const arr = enderecoToItems.get(it.endereco) ?? [];
    arr.push(it);
    enderecoToItems.set(it.endereco, arr);
  }

  await Promise.allSettled(
    Array.from(enderecoToItems.entries()).map(async ([endereco, list]) => {
      try {
        const coord = await geocodeEndereco(endereco);
        if (!coord) return;
        const forecast = await getForecast(coord.lat, coord.lng);
        for (const it of list) {
          const iso = toISODate(new Date(it.data));
          it.weather = pickDay(forecast, iso);
        }
      } catch {
        // weather permanece null
      }
    })
  );

  return items;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inicioStr = searchParams.get("inicio");
  const fimStr = searchParams.get("fim");
  if (!inicioStr || !fimStr) {
    return NextResponse.json({ error: "inicio e fim são obrigatórios" }, { status: 400 });
  }

  const inicio = new Date(inicioStr + "T00:00:00");
  const fim = new Date(fimStr + "T23:59:59");
  if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
    return NextResponse.json({ error: "datas inválidas" }, { status: 400 });
  }

  const [visitas, obrasInicio, obrasFim, etapas] = await Promise.all([
    prisma.visita.findMany({
      where: { dataAgendada: { gte: inicio, lte: fim } },
      include: {
        cliente: { select: { nome: true } },
        tecnico: { select: { name: true } },
      },
      orderBy: { dataAgendada: "asc" },
    }),
    prisma.obra.findMany({
      where: { dataInicio: { gte: inicio, lte: fim } },
      include: {
        cliente: { select: { nome: true } },
        responsavel: { select: { name: true } },
      },
      orderBy: { dataInicio: "asc" },
    }),
    prisma.obra.findMany({
      where: { previsaoTermino: { gte: inicio, lte: fim } },
      include: {
        cliente: { select: { nome: true } },
        responsavel: { select: { name: true } },
      },
      orderBy: { previsaoTermino: "asc" },
    }),
    prisma.etapa.findMany({
      where: { dataPrevista: { gte: inicio, lte: fim } },
      include: {
        obra: {
          select: {
            id: true,
            nome: true,
            numero: true,
            endereco: true,
            cliente: { select: { nome: true } },
          },
        },
        responsavel: { select: { name: true } },
      },
      orderBy: { dataPrevista: "asc" },
    }),
  ]);

  const items: AgendaItem[] = [];

  for (const v of visitas) {
    items.push({
      id: `v-${v.id}`,
      tipo: "VISITA",
      titulo: `Visita · ${v.cliente?.nome ?? "Cliente"}`,
      data: v.dataAgendada.toISOString(),
      endereco: v.endereco,
      cliente: v.cliente?.nome ?? null,
      responsavel: v.tecnico?.name ?? null,
      status: v.status,
      weather: null,
      href: `/dashboard/visita/${v.id}`,
    });
  }
  for (const o of obrasInicio) {
    items.push({
      id: `oi-${o.id}`,
      tipo: "OBRA_INICIO",
      titulo: `Início obra · ${o.numero} ${o.nome}`,
      data: o.dataInicio.toISOString(),
      endereco: o.endereco,
      cliente: o.cliente?.nome ?? null,
      responsavel: o.responsavel?.name ?? null,
      status: o.status,
      weather: null,
      href: `/dashboard/obras/${o.id}`,
    });
  }
  for (const o of obrasFim) {
    items.push({
      id: `of-${o.id}`,
      tipo: "OBRA_FIM",
      titulo: `Previsão fim · ${o.numero} ${o.nome}`,
      data: o.previsaoTermino.toISOString(),
      endereco: o.endereco,
      cliente: o.cliente?.nome ?? null,
      responsavel: o.responsavel?.name ?? null,
      status: o.status,
      weather: null,
      href: `/dashboard/obras/${o.id}`,
    });
  }
  for (const e of etapas) {
    items.push({
      id: `e-${e.id}`,
      tipo: "ETAPA",
      titulo: `Etapa · ${e.nome} (${e.obra.numero})`,
      data: e.dataPrevista.toISOString(),
      endereco: e.obra.endereco,
      cliente: e.obra.cliente?.nome ?? null,
      responsavel: e.responsavel?.name ?? null,
      status: e.status,
      weather: null,
      href: `/dashboard/obras/${e.obra.id}`,
    });
  }

  items.sort((a, b) => a.data.localeCompare(b.data));
  await attachWeather(items);

  return NextResponse.json({ data: items });
}
