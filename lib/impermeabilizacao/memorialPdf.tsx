import React from "react";
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { REGRAS, type AmbienteCalculado, type ResumoOrcamento } from "./regras";

const BRAND = "#0F5E7E";
const DARK = "#0A4258";
const LIGHT = "#E1EDF2";
const GRAY = "#6B7280";
const LINE = "#D9DEE5";

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 40, paddingHorizontal: 34, fontSize: 9, color: "#1F2937", fontFamily: "Helvetica" },
  h1: { fontSize: 17, fontFamily: "Helvetica-Bold", color: DARK },
  sub: { fontSize: 9, color: GRAY, marginTop: 2 },
  faixa: { height: 3, backgroundColor: BRAND, marginTop: 8, marginBottom: 12 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 },
  chip: { backgroundColor: LIGHT, color: DARK, fontSize: 8, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3, marginRight: 4 },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  kpi: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 6, padding: 8, borderTopWidth: 3 },
  kpiLabel: { fontSize: 7, color: GRAY, textTransform: "uppercase" },
  kpiVal: { fontSize: 13, fontFamily: "Helvetica-Bold", color: DARK, marginTop: 3 },
  secTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK, marginTop: 6, marginBottom: 6 },
  th: { flexDirection: "row", backgroundColor: BRAND, color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 8 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: LINE },
  trAlt: { backgroundColor: "#F5F8FA" },
  cell: { paddingVertical: 3, paddingHorizontal: 4 },
  cellR: { paddingVertical: 3, paddingHorizontal: 4, textAlign: "right" },
  footNote: { position: "absolute", bottom: 22, left: 34, right: 34, fontSize: 7, color: GRAY, borderTopWidth: 1, borderColor: LINE, paddingTop: 6 },
  aviso: { fontSize: 7, color: "#B45309" },
});

function n(v: number, d = 2) {
  return (v ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

// larguras das colunas (soma = 100)
const W = { nome: 26, tipo: 20, piso: 9, perim: 9, alt: 8, box: 8, rep: 5, total: 15 };

export interface DadosMemorial {
  arquivo: string;
  empresa?: string;
  cliente?: string;
  data: string;
  preco?: number;
  resumo: ResumoOrcamento;
}

function MemorialDoc({ dados }: { dados: DadosMemorial }) {
  const { resumo } = dados;
  const valor = dados.preco && dados.preco > 0 ? resumo.areaTotalGeral * dados.preco : 0;

  return (
    <Document title={`Memorial - ${dados.arquivo}`} author={dados.empresa || "Verus Impermeabilização"}>
      <Page size="A4" style={s.page} wrap>
        <Text style={s.h1}>Memorial de Quantitativo — Impermeabilização</Text>
        <Text style={s.sub}>{dados.empresa || "Verus Impermeabilização"} · base ABNT NBR 9575 / 9574</Text>
        <View style={s.faixa} />

        <View style={s.metaRow}>
          <Text style={s.chip}>Arquivo: {dados.arquivo}</Text>
          {dados.cliente ? <Text style={s.chip}>Cliente: {dados.cliente}</Text> : null}
          <Text style={s.chip}>Data: {dados.data}</Text>
          <Text style={s.chip}>{resumo.ambientes.length} ambientes</Text>
        </View>

        <View style={s.kpiRow}>
          <View style={[s.kpi, { borderTopColor: BRAND }]}>
            <Text style={s.kpiLabel}>Área total</Text>
            <Text style={s.kpiVal}>{n(resumo.areaTotalGeral)} m²</Text>
          </View>
          <View style={[s.kpi, { borderTopColor: "#2D7DD2" }]}>
            <Text style={s.kpiLabel}>Piso</Text>
            <Text style={s.kpiVal}>{n(resumo.areaPisoTotal)} m²</Text>
          </View>
          <View style={[s.kpi, { borderTopColor: "#1D9E75" }]}>
            <Text style={s.kpiLabel}>Rodapé/paredes</Text>
            <Text style={s.kpiVal}>{n(resumo.areaRodapeTotal)} m²</Text>
          </View>
          <View style={[s.kpi, { borderTopColor: "#F0A500" }]}>
            <Text style={s.kpiLabel}>Box chuveiro</Text>
            <Text style={s.kpiVal}>{n(resumo.areaBoxTotal)} m²</Text>
          </View>
          {valor > 0 ? (
            <View style={[s.kpi, { borderTopColor: DARK }]}>
              <Text style={s.kpiLabel}>Valor (R$ {n(dados.preco!)}/m²)</Text>
              <Text style={s.kpiVal}>R$ {n(valor)}</Text>
            </View>
          ) : null}
        </View>

        <Text style={s.secTitle}>Ambientes</Text>
        <View style={s.th}>
          <Text style={[s.cell, { width: `${W.nome}%` }]}>Ambiente</Text>
          <Text style={[s.cell, { width: `${W.tipo}%` }]}>Tipo</Text>
          <Text style={[s.cellR, { width: `${W.piso}%` }]}>Piso</Text>
          <Text style={[s.cellR, { width: `${W.perim}%` }]}>Perím.</Text>
          <Text style={[s.cellR, { width: `${W.alt}%` }]}>Alt.</Text>
          <Text style={[s.cellR, { width: `${W.box}%` }]}>Box m²</Text>
          <Text style={[s.cellR, { width: `${W.rep}%` }]}>Rep</Text>
          <Text style={[s.cellR, { width: `${W.total}%` }]}>Total m²</Text>
        </View>
        {resumo.ambientes.map((a: AmbienteCalculado, i: number) => (
          <View key={i} style={[s.tr, ...(i % 2 ? [s.trAlt] : [])]} wrap={false}>
            <View style={[s.cell, { width: `${W.nome}%` }]}>
              <Text>{a.nome}</Text>
              {a.avisos.length ? <Text style={s.aviso}>{a.avisos[0]}</Text> : null}
            </View>
            <Text style={[s.cell, { width: `${W.tipo}%` }]}>{REGRAS[a.tipo].label}</Text>
            <Text style={[s.cellR, { width: `${W.piso}%` }]}>{n(a.areaPiso)}</Text>
            <Text style={[s.cellR, { width: `${W.perim}%` }]}>{n(a.perimetro)}</Text>
            <Text style={[s.cellR, { width: `${W.alt}%` }]}>{n(a.alturaUsada)}</Text>
            <Text style={[s.cellR, { width: `${W.box}%` }]}>{n(a.areaBox)}</Text>
            <Text style={[s.cellR, { width: `${W.rep}%` }]}>{a.repeticaoUsada}</Text>
            <Text style={[s.cellR, { width: `${W.total}%`, fontFamily: "Helvetica-Bold", color: DARK }]}>{n(a.areaTotal)}</Text>
          </View>
        ))}
        <View style={[s.tr, { backgroundColor: LIGHT }]} wrap={false}>
          <Text style={[s.cell, { width: `${100 - W.total}%`, textAlign: "right", fontFamily: "Helvetica-Bold" }]}>Área total geral</Text>
          <Text style={[s.cellR, { width: `${W.total}%`, fontFamily: "Helvetica-Bold", color: DARK }]}>{n(resumo.areaTotalGeral)}</Text>
        </View>

        <Text style={s.secTitle}>Resumo por sistema</Text>
        <View style={s.th}>
          <Text style={[s.cell, { width: "60%" }]}>Sistema / tipo de ambiente</Text>
          <Text style={[s.cellR, { width: "15%" }]}>Ambientes</Text>
          <Text style={[s.cellR, { width: "25%" }]}>Área (m²)</Text>
        </View>
        {resumo.porTipo.map((t, i) => (
          <View key={t.tipo} style={[s.tr, ...(i % 2 ? [s.trAlt] : [])]} wrap={false}>
            <Text style={[s.cell, { width: "60%" }]}>{t.label}</Text>
            <Text style={[s.cellR, { width: "15%" }]}>{t.qtd}</Text>
            <Text style={[s.cellR, { width: "25%" }]}>{n(t.area)}</Text>
          </View>
        ))}

        <Text style={s.footNote} fixed>
          Regra: Área total = piso + (perímetro × altura de subida) + box (1,50 m). Alturas por função conforme ABNT NBR 9575/9574.
          Rodapé de área molhada 0,30 m · box de chuveiro 1,50 m · reservatório/piscina na altura da lâmina · câmara frigorífica a rodapé.
          Alturas de reservatório e platibanda devem ser confirmadas em obra.
        </Text>
      </Page>
    </Document>
  );
}

export async function gerarMemorialPdf(dados: DadosMemorial): Promise<Buffer> {
  return renderToBuffer(<MemorialDoc dados={dados} />);
}
