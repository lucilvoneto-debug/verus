import { NextRequest, NextResponse } from "next/server";
import { geocodeEndereco } from "@/lib/geocode";
import { getForecast, pickDay } from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const endereco = searchParams.get("endereco");
  const dataStr = searchParams.get("data"); // YYYY-MM-DD
  if (!endereco) {
    return NextResponse.json({ error: "endereco é obrigatório" }, { status: 400 });
  }

  try {
    const coord = await geocodeEndereco(endereco);
    if (!coord) return NextResponse.json({ weather: null, cidade: null });
    const forecast = await getForecast(coord.lat, coord.lng);
    const weather = dataStr ? pickDay(forecast, dataStr) : forecast[0] ?? null;
    return NextResponse.json({
      weather,
      cidade: coord.cidade,
      forecast,
    });
  } catch {
    return NextResponse.json({ weather: null, cidade: null });
  }
}
