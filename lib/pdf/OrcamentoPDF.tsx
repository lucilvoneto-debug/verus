import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { styles, empresaFallback, brand } from "./styles";

type Empresa = {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  logoBase64?: string | null;
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

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR");
}

function fmtArea(area: number | null, qty: number, unidade: string): string {
  const n = area ?? qty;
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)} ${unidade.toLowerCase()}`;
}

export function OrcamentoPDF({ data }: { data: OrcamentoPDFData }) {
  const empresa = { ...empresaFallback, ...(data.empresa ?? {}) };
  const garantia = data.garantiaMeses ?? 60;
  const garantiaAnos = Math.round(garantia / 12);

  return (
    <Document>
      {/* PAGE 1 — capa + serviços */}
      <Page size="A4" style={styles.page}>
        {/* Diagonal blue stripes */}
        <View style={styles.stripeTop} fixed />
        <View style={styles.stripeBottom} fixed />

        {/* Logo */}
        <View style={styles.logoBlock} fixed>
          {empresa.logoBase64 ? (
            <Image src={empresa.logoBase64} style={styles.logoImage} />
          ) : (
            <Text style={{ fontSize: 24, fontFamily: "Helvetica-Bold", color: brand.primary }}>
              VERUS
            </Text>
          )}
          <Text style={styles.brandName}>IMPERMEABILIZAÇÕES</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</Text>

        <Text style={styles.intro}>
          O presente Contrato tem como objetivo executar serviços de impermeabilização visando
          proteção contra umidade e infiltrações, garantindo maior vida útil.
        </Text>

        {/* Header data */}
        <View style={styles.headerData}>
          <Text style={styles.headerLine}>
            <Text style={styles.headerLabel}>Data: </Text>
            {fmtDate(data.criadoEm)}
          </Text>
          {data.obraNome ? (
            <Text style={styles.headerLine}>
              <Text style={styles.headerLabel}>Obra: </Text>
              {data.obraNome}
            </Text>
          ) : null}
          <Text style={styles.headerLine}>
            <Text style={styles.headerLabel}>Cliente: </Text>
            {data.cliente.nome}
          </Text>
          {data.cliente.endereco ? (
            <Text style={styles.headerLine}>
              <Text style={styles.headerLabel}>Endereço: </Text>
              {data.cliente.endereco}
            </Text>
          ) : null}
          {data.responsavel ? (
            <Text style={styles.headerLine}>
              <Text style={styles.headerLabel}>Responsável: </Text>
              {data.responsavel}
            </Text>
          ) : null}
          {data.contatoResponsavel || data.cliente.telefone ? (
            <Text style={styles.headerLine}>
              <Text style={styles.headerLabel}>Contato: </Text>
              {data.contatoResponsavel || data.cliente.telefone}
            </Text>
          ) : null}
        </View>

        {/* DESCRIÇÃO DOS SERVIÇOS */}
        <Text style={styles.sectionTitle}>DESCRIÇÃO DOS SERVIÇOS:</Text>
        <View style={styles.servicesBox}>
          {data.itens.map((it, idx) => (
            <Text key={idx} style={styles.serviceItem}>
              {it.servicoNome}
              {it.descricao ? ` — ${it.descricao}` : ""}: {fmtArea(it.area, it.quantidade, it.unidade)}
            </Text>
          ))}
        </View>

        {/* DESCRIÇÃO DAS ÁREAS */}
        <Text style={styles.sectionTitle}>DESCRIÇÃO DAS ÁREAS:</Text>
        {data.itens.map((it, idx) => (
          <View key={idx} style={styles.serviceBlock} wrap={false}>
            <Text style={styles.serviceBlockTitle}>{it.servicoNome.toUpperCase()}</Text>
            <Text style={styles.serviceBlockRow}>
              ÁREA TOTAL: {fmtArea(it.area, it.quantidade, it.unidade)}
            </Text>
            <Text style={styles.serviceBlockRow}>
              VALOR UNITÁRIO: {fmtCurrency(it.precoUnit)}
            </Text>
            <Text style={styles.serviceBlockRowLast}>
              VALOR TOTAL: {fmtCurrency(it.subtotal)}
            </Text>
          </View>
        ))}

        {/* Total geral */}
        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmtCurrency(data.subtotal)}</Text>
          </View>
          {data.desconto > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Desconto</Text>
              <Text style={styles.totalValue}>- {fmtCurrency(data.desconto)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalFinalLabel}>VALOR TOTAL</Text>
            <Text style={styles.totalFinalValue}>{fmtCurrency(data.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerLine}>{empresa.telefone}</Text>
            <Text style={styles.footerLine}>{empresa.email}</Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2 — termos e assinaturas */}
      <Page size="A4" style={styles.page}>
        <View style={styles.stripeTop} fixed />
        <View style={styles.stripeBottom} fixed />

        <View style={styles.logoBlock} fixed>
          {empresa.logoBase64 ? (
            <Image src={empresa.logoBase64} style={styles.logoImage} />
          ) : (
            <Text style={{ fontSize: 24, fontFamily: "Helvetica-Bold", color: brand.primary }}>
              VERUS
            </Text>
          )}
          <Text style={styles.brandName}>IMPERMEABILIZAÇÕES</Text>
        </View>

        <View style={styles.termSection}>
          <Text style={styles.termTitle}>PRAZO DE EXECUÇÃO:</Text>
          <Text style={styles.termText}>
            {data.prazoExecucao || "Conforme cronograma e liberação das áreas da obra."}
          </Text>
        </View>

        <View style={styles.termSection}>
          <Text style={styles.termTitle}>CONDIÇÕES DE PAGAMENTOS:</Text>
          <Text style={styles.termText}>
            {data.condicaoPagamento || "À vista: Medições quinzenais."}
          </Text>
        </View>

        <View style={styles.termSection}>
          <Text style={styles.termTitle}>GARANTIA:</Text>
          <Text style={styles.termText}>
            A Verus Impermeabilizações garante os serviços executados pelo prazo de{" "}
            {String(garantiaAnos).padStart(2, "0")} ({garantiaAnos === 1 ? "um" : garantiaAnos === 2 ? "dois" : garantiaAnos === 3 ? "três" : garantiaAnos === 4 ? "quatro" : garantiaAnos === 5 ? "cinco" : garantiaAnos === 10 ? "dez" : String(garantiaAnos)}) anos contra falhas de aplicação, não incluindo danos causados por terceiros ou problemas estruturais.
          </Text>
        </View>

        {data.observacoes ? (
          <View style={styles.termSection}>
            <Text style={styles.termTitle}>OBSERVAÇÕES:</Text>
            <Text style={styles.termText}>{data.observacoes}</Text>
          </View>
        ) : null}

        <View style={styles.signaturesArea}>
          <Text style={styles.signatureLabel}>VERUS IMPERMEABILIZAÇÕES</Text>
          <View style={styles.signatureLine} />

          <Text style={[styles.signatureLabel, { marginTop: 50 }]}>CONTRATANTE</Text>
          <View style={styles.signatureLine} />
        </View>

        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerLine}>{empresa.telefone}</Text>
            <Text style={styles.footerLine}>{empresa.email}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
