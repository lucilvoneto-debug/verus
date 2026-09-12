/**
 * GET ?periodo=mes|trimestre|ano|12m|30d&inicio=&fim=            → JSON com todas as seções
 * GET ?formato=csv&secao=funil|orcamentos|obras|fluxo|inadimplencia|despesas&periodo=… → arquivo CSV
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import {
  despesasPorCategoria,
  fluxoMensal,
  funilPorOrigem,
  inadimplencia,
  leadsPorEtapa,
  motivosPerda,
  obrasDoPeriodo,
  orcamentosDoPeriodo,
  paraCsv,
  periodoDe,
  posVenda,
  resumirOrcamentos,
} from "@/lib/relatorios";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const periodo = periodoDe(sp.get("periodo"), sp.get("inicio"), sp.get("fim"));
  const formato = sp.get("formato");

  if (formato === "csv") {
    const secao = sp.get("secao") ?? "orcamentos";
    let rows: Record<string, unknown>[] = [];
    if (secao === "funil") rows = await funilPorOrigem(periodo);
    else if (secao === "orcamentos") rows = await orcamentosDoPeriodo(periodo);
    else if (secao === "obras") rows = await obrasDoPeriodo(periodo);
    else if (secao === "fluxo") rows = await fluxoMensal(periodo);
    else if (secao === "inadimplencia") rows = await inadimplencia();
    else if (secao === "despesas") rows = await despesasPorCategoria(periodo);
    else if (secao === "motivos") rows = await motivosPerda(periodo);
    else return NextResponse.json({ error: "secao inválida" }, { status: 400 });

    const nome = `verus-${secao}-${periodo.inicio.toISOString().slice(0, 10)}_${periodo.fim.toISOString().slice(0, 10)}.csv`;
    return new NextResponse(paraCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nome}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const [funil, etapas, motivos, orcamentos, obras, fluxo, inad, despesas, pv] = await Promise.all([
    funilPorOrigem(periodo),
    leadsPorEtapa(),
    motivosPerda(periodo),
    orcamentosDoPeriodo(periodo),
    obrasDoPeriodo(periodo),
    fluxoMensal(periodo),
    inadimplencia(),
    despesasPorCategoria(periodo),
    posVenda(periodo),
  ]);

  return NextResponse.json({
    periodo,
    funil,
    etapas,
    motivos,
    orcamentos: { resumo: resumirOrcamentos(orcamentos), linhas: orcamentos.slice(0, 200) },
    obras,
    fluxo,
    inadimplencia: inad,
    despesas,
    posVenda: pv,
  });
}
