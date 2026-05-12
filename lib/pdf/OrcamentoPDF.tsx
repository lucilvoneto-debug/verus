import { Document, Image, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { empresaFallback, brand } from "./styles";

type Empresa = {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  logoBase64?: string | null;
  bgPag1Base64?: string | null;
  bgPag2Base64?: string | null;
};

type Item = {
  servicoNome: string;
  descricao: string;
  area: number | null;
  quantidade: number;
  unidade: string;
  custoUnit: number;
  precoUnit: number;
  subtotal: number;
};

export type OrcamentoPDFData = {
  numero: string;
  criadoEm: Date | string;
  dataValidade: Date | string;
  obraNome?: string | null;
  responsavel?: string | null;
  contatoResponsavel?: string | null;
  cliente: {
    nome: string;
    tipo: string;
    documento: string;
    email?: string | null;
    telefone?: string | null;
    endereco?: string | null;
  };
  itens: Item[];
  subtotal: number;
  desconto: number;
  total: number;
  condicaoPagamento?: string | null;
  prazoExecucao?: string | null;
  garantiaMeses?: number | null;
  observacoes?: string | null;
  empresa?: Partial<Empresa>;
};

const s = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: brand.text,
    position: "relative",
    paddingTop: 130,
    paddingBottom: 200,
    paddingHorizontal: 70,
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginBottom: 10,
    textAlign: "center",
  },
  intro: {
    fontSize: 10.5,
    lineHeight: 1.5,
    color: brand.text,
    marginBottom: 18,
  },
  headerData: { marginBottom: 18 },
  headerLine: {
    fontSize: 10.5,
    marginBottom: 3,
    color: brand.text,
  },
  headerLabel: { fontFamily: "Helvetica-Bold" },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginTop: 6,
    marginBottom: 6,
  },
  servicesBox: {
    borderWidth: 1,
    borderColor: brand.text,
    padding: 10,
    marginBottom: 14,
  },
  serviceItem: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: brand.text,
  },
  block: {
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: brand.muted,
  },
  blockTitle: {
    backgroundColor: brand.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    textAlign: "center",
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    borderBottomWidth: 0.5,
    borderBottomColor: brand.muted,
  },
  blockRow: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 0.5,
    borderBottomColor: brand.muted,
    color: brand.text,
  },
  blockRowLast: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
  },
  totalBox: {
    marginTop: 14,
    padding: 10,
    backgroundColor: brand.primaryLight,
    borderWidth: 1,
    borderColor: brand.primary,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  totalLabel: { fontSize: 10.5, color: brand.text },
  totalValue: { fontSize: 10.5, color: brand.text },
  totalFinalLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: brand.primaryDark },
  totalFinalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: brand.primaryDark },
  termSection: { marginBottom: 18 },
  termTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginBottom: 4,
  },
  termText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: brand.text,
  },
  signaturesArea: {
    marginTop: 80,
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginTop: 20,
    marginBottom: 4,
  },
  signatureLine: {
    width: 300,
    borderBottomWidth: 1,
    borderBottomColor: brand.text,
    height: 1,
    marginTop: 20,
  },
});

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function fmtDate(d: Date | string): string {
  return (typeof d === "string" ? new Date(d) : d).toLocaleDateString("pt-BR");
}
function fmtArea(area: number | null, qty: number, unidade: string): string {
  const n = area ?? qty;
  const u = (unidade || "").toUpperCase() === "M2" ? "m²" : unidade.toLowerCase();
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)} ${u}`;
}
const NUM_TO_TEXT: Record<number, string> = {
  1: "um", 2: "dois", 3: "três", 4: "quatro", 5: "cinco",
  6: "seis", 7: "sete", 8: "oito", 9: "nove", 10: "dez",
};

export function OrcamentoPDF({ data }: { data: OrcamentoPDFData }) {
  const empresa = { ...empresaFallback, ...(data.empresa ?? {}) };
  const garantia = data.garantiaMeses ?? 60;
  const anos = Math.round(garantia / 12);
  const anosTxt = NUM_TO_TEXT[anos] ?? String(anos);

  return (
    <Document>
      {/* PAGE 1 */}
      <Page size="A4" style={s.page}>
        {empresa.bgPag1Base64 ? (
          <Image src={empresa.bgPag1Base64} style={s.bgImage} fixed />
        ) : null}

        <Text style={s.title}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</Text>
        <Text style={s.intro}>
          O presente Contrato tem como objetivo executar serviços de impermeabilização visando
          proteção contra umidade e infiltrações, garantindo maior vida útil.
        </Text>

        <View style={s.headerData}>
          <Text style={s.headerLine}>
            <Text style={s.headerLabel}>Data: </Text>
            {fmtDate(data.criadoEm)}
          </Text>
          {data.obraNome ? (
            <Text style={s.headerLine}>
              <Text style={s.headerLabel}>Obra: </Text>
              {data.obraNome}
            </Text>
          ) : null}
          <Text style={s.headerLine}>
            <Text style={s.headerLabel}>Cliente: </Text>
            {data.cliente.nome}
          </Text>
          {data.cliente.endereco ? (
            <Text style={s.headerLine}>
              <Text style={s.headerLabel}>Endereço: </Text>
              {data.cliente.endereco}
            </Text>
          ) : null}
          {data.responsavel ? (
            <Text style={s.headerLine}>
              <Text style={s.headerLabel}>Responsável: </Text>
              {data.responsavel}
            </Text>
          ) : null}
          {data.contatoResponsavel || data.cliente.telefone ? (
            <Text style={s.headerLine}>
              <Text style={s.headerLabel}>Contato: </Text>
              {data.contatoResponsavel || data.cliente.telefone}
            </Text>
          ) : null}
        </View>

        <Text style={s.sectionTitle}>DESCRIÇÃO DOS SERVIÇOS:</Text>
        <View style={s.servicesBox}>
          {data.itens.map((it, idx) => (
            <Text key={idx} style={s.serviceItem}>
              {it.servicoNome}
              {it.descricao ? ` — ${it.descricao}` : ""}:{" "}
              {fmtArea(it.area, it.quantidade, it.unidade)}
            </Text>
          ))}
        </View>

        <Text style={s.sectionTitle}>DESCRIÇÃO DAS ÁREAS:</Text>
        {data.itens.map((it, idx) => (
          <View key={idx} style={s.block} wrap={false}>
            <Text style={s.blockTitle}>{it.servicoNome.toUpperCase()}</Text>
            <Text style={s.blockRow}>
              ÁREA TOTAL: {fmtArea(it.area, it.quantidade, it.unidade)}
            </Text>
            <Text style={s.blockRow}>VALOR UNITÁRIO: {fmtCurrency(it.precoUnit)}</Text>
            <Text style={s.blockRowLast}>VALOR TOTAL: {fmtCurrency(it.subtotal)}</Text>
          </View>
        ))}

        <View style={s.totalBox} wrap={false}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{fmtCurrency(data.subtotal)}</Text>
          </View>
          {data.desconto > 0 ? (
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Desconto</Text>
              <Text style={s.totalValue}>- {fmtCurrency(data.desconto)}</Text>
            </View>
          ) : null}
          <View style={s.totalRow}>
            <Text style={s.totalFinalLabel}>VALOR TOTAL</Text>
            <Text style={s.totalFinalValue}>{fmtCurrency(data.total)}</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2 */}
      <Page size="A4" style={s.page}>
        {empresa.bgPag2Base64 ? (
          <Image src={empresa.bgPag2Base64} style={s.bgImage} fixed />
        ) : null}

        <View style={s.termSection}>
          <Text style={s.termTitle}>PRAZO DE EXECUÇÃO:</Text>
          <Text style={s.termText}>
            {data.prazoExecucao || "Conforme cronograma e liberação das áreas da obra."}
          </Text>
        </View>

        <View style={s.termSection}>
          <Text style={s.termTitle}>CONDIÇÕES DE PAGAMENTOS:</Text>
          <Text style={s.termText}>
            {data.condicaoPagamento || "À vista: Medições quinzenais."}
          </Text>
        </View>

        <View style={s.termSection}>
          <Text style={s.termTitle}>GARANTIA:</Text>
          <Text style={s.termText}>
            A Verus Impermeabilizações garante os serviços executados pelo prazo de{" "}
            {String(anos).padStart(2, "0")} ({anosTxt}) anos contra falhas de aplicação, não
            incluindo danos causados por terceiros ou problemas estruturais.
          </Text>
        </View>

        {data.observacoes ? (
          <View style={s.termSection}>
            <Text style={s.termTitle}>OBSERVAÇÕES:</Text>
            <Text style={s.termText}>{data.observacoes}</Text>
          </View>
        ) : null}

        <View style={s.signaturesArea}>
          <Text style={s.signatureLabel}>VERUS IMPERMEABILIZAÇÕES</Text>
          <View style={s.signatureLine} />

          <Text style={[s.signatureLabel, { marginTop: 60 }]}>CONTRATANTE</Text>
          <View style={s.signatureLine} />
        </View>
      </Page>
    </Document>
  );
}
