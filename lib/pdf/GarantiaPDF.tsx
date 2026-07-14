import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const BRAND = "#0F5E7E";
const DARK = "#0A4258";

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 48, paddingHorizontal: 44, fontSize: 11, color: "#1F2937", fontFamily: "Helvetica", lineHeight: 1.5 },
  faixa: { height: 4, backgroundColor: BRAND, marginBottom: 18 },
  empresa: { fontSize: 10, color: "#6B7280" },
  titulo: { fontSize: 20, fontFamily: "Helvetica-Bold", color: DARK, marginTop: 8, marginBottom: 2 },
  sub: { fontSize: 10, color: "#6B7280", marginBottom: 18 },
  bloco: { marginBottom: 12 },
  label: { fontSize: 9, color: "#6B7280", textTransform: "uppercase" },
  valor: { fontSize: 12, color: "#111827" },
  h: { fontSize: 12, fontFamily: "Helvetica-Bold", color: DARK, marginTop: 14, marginBottom: 4 },
  p: { fontSize: 11, marginBottom: 6, textAlign: "justify" },
  li: { fontSize: 11, marginBottom: 3 },
  assin: { marginTop: 48, flexDirection: "row", justifyContent: "space-between" },
  linhaAssin: { borderTopWidth: 1, borderColor: "#111827", width: 220, paddingTop: 4, fontSize: 10, textAlign: "center" },
  rodape: { position: "absolute", bottom: 24, left: 44, right: 44, fontSize: 8, color: "#9CA3AF", textAlign: "center", borderTopWidth: 1, borderColor: "#E5E7EB", paddingTop: 6 },
});

export interface DadosGarantia {
  empresa: { nome: string; cnpj?: string; telefone?: string; endereco?: string };
  clienteNome: string;
  obraNome: string;
  obraEndereco: string;
  numero: string;
  dataConclusao: string;
  garantiaMeses: number;
  sistema?: string;
}

export function GarantiaPDF({ d }: { d: DadosGarantia }) {
  const anos = Math.round(d.garantiaMeses / 12);
  return (
    <Document title={`Termo de Garantia - ${d.obraNome}`} author={d.empresa.nome}>
      <Page size="A4" style={s.page}>
        <Text style={s.empresa}>{d.empresa.nome}{d.empresa.cnpj ? ` · CNPJ ${d.empresa.cnpj}` : ""}</Text>
        <View style={s.faixa} />
        <Text style={s.titulo}>Termo de Garantia</Text>
        <Text style={s.sub}>Serviço de impermeabilização · ABNT NBR 9575 / 9574</Text>

        <View style={s.bloco}>
          <Text style={s.label}>Cliente</Text>
          <Text style={s.valor}>{d.clienteNome}</Text>
        </View>
        <View style={s.bloco}>
          <Text style={s.label}>Obra</Text>
          <Text style={s.valor}>{d.obraNome} — {d.obraEndereco}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 40 }}>
          <View style={s.bloco}><Text style={s.label}>Conclusão</Text><Text style={s.valor}>{d.dataConclusao}</Text></View>
          <View style={s.bloco}><Text style={s.label}>Garantia</Text><Text style={s.valor}>{anos} anos ({d.garantiaMeses} meses)</Text></View>
          <View style={s.bloco}><Text style={s.label}>Referência</Text><Text style={s.valor}>{d.numero}</Text></View>
        </View>

        <Text style={s.p}>
          A {d.empresa.nome} garante o serviço de impermeabilização executado na obra acima, pelo prazo
          de {anos} anos a contar da data de conclusão, contra infiltração decorrente de falha na aplicação
          do sistema, conforme ABNT NBR 9575 e 9574.
          {d.sistema ? ` Sistema aplicado: ${d.sistema}.` : ""}
        </Text>

        <Text style={s.h}>A garantia cobre</Text>
        <Text style={s.li}>• Falhas de aplicação (descolamento, emenda mal executada, ponto de infiltração no sistema aplicado).</Text>
        <Text style={s.li}>• Correção do ponto com falha, sem custo de mão de obra.</Text>

        <Text style={s.h}>A garantia NÃO cobre</Text>
        <Text style={s.li}>• Danos por terceiros, obras/reformas posteriores ou perfuração do sistema.</Text>
        <Text style={s.li}>• Movimentação estrutural, trincas na estrutura ou recalque não previstos em projeto.</Text>
        <Text style={s.li}>• Entupimento de ralos/tubulações e falta de manutenção/limpeza.</Text>
        <Text style={s.li}>• Material fornecido pela obra/contratante (garantia é sobre o serviço de aplicação).</Text>

        <Text style={s.h}>Condição</Text>
        <Text style={s.p}>
          Para acionar a garantia, comunique a {d.empresa.nome}{d.empresa.telefone ? ` (${d.empresa.telefone})` : ""} descrevendo o
          ponto. A vistoria e o reparo serão agendados. A garantia perde validade em caso de intervenção de
          terceiros no sistema aplicado.
        </Text>

        <View style={s.assin}>
          <Text style={s.linhaAssin}>{d.empresa.nome}</Text>
          <Text style={s.linhaAssin}>{d.clienteNome}</Text>
        </View>

        <Text style={s.rodape} fixed>
          {d.empresa.nome}{d.empresa.endereco ? ` · ${d.empresa.endereco}` : ""}{d.empresa.telefone ? ` · ${d.empresa.telefone}` : ""}
        </Text>
      </Page>
    </Document>
  );
}
