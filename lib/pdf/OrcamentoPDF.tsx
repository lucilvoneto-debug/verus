import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, empresaFallback } from "./styles";

type Empresa = {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
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

export function OrcamentoPDF({ data }: { data: OrcamentoPDFData }) {
  const empresa = { ...empresaFallback, ...(data.empresa ?? {}) };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandMark}>VERUS</Text>
            <Text style={styles.brandSub}>Impermeabilizações</Text>
          </View>
          <View style={styles.empresaBlock}>
            <Text style={styles.empresaNome}>{empresa.nome}</Text>
            <Text>CNPJ: {empresa.cnpj}</Text>
            <Text>{empresa.endereco}</Text>
            <Text>
              {empresa.telefone} · {empresa.email}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>ORÇAMENTO Nº {data.numero}</Text>
        <Text style={styles.subtitle}>
          Emitido em {fmtDate(data.criadoEm)} · Validade {fmtDate(data.dataValidade)}
        </Text>

        {/* Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Nome</Text>
              <Text style={styles.value}>{data.cliente.nome}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>{data.cliente.tipo === "PJ" ? "CNPJ" : "CPF"}</Text>
              <Text style={styles.value}>{data.cliente.documento}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Contato</Text>
              <Text style={styles.value}>
                {data.cliente.email || "—"} · {data.cliente.telefone || "—"}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Endereço</Text>
              <Text style={styles.value}>{data.cliente.endereco || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Itens */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens do orçamento</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Serviço / descrição</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Área</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Qtd</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>
                Custo un.
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>
                Preço un.
              </Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.2, textAlign: "right" }]}>
                Subtotal
              </Text>
            </View>
            {data.itens.map((it, idx) => (
              <View key={idx} style={styles.tableRow} wrap={false}>
                <View style={{ flex: 3 }}>
                  <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>
                    {it.servicoNome}
                  </Text>
                  <Text style={[styles.tableCell, { color: "#6B7280" }]}>{it.descricao}</Text>
                </View>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                  {it.area ? `${it.area} m²` : "—"}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                  {it.quantidade} {it.unidade}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: "right" }]}>
                  {fmtCurrency(it.custoUnit)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: "right" }]}>
                  {fmtCurrency(it.precoUnit)}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2, textAlign: "right" }]}>
                  {fmtCurrency(it.subtotal)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{fmtCurrency(data.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Desconto</Text>
              <Text style={styles.totalsValue}>- {fmtCurrency(data.desconto)}</Text>
            </View>
            <View style={styles.totalFinal}>
              <Text style={styles.totalFinalLabel}>TOTAL</Text>
              <Text style={styles.totalFinalValue}>{fmtCurrency(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Condições */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Condições</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Condição de pagamento</Text>
              <Text style={styles.value}>{data.condicaoPagamento || "—"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Prazo de execução</Text>
              <Text style={styles.value}>{data.prazoExecucao || "—"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Validade</Text>
              <Text style={styles.value}>{fmtDate(data.dataValidade)}</Text>
            </View>
          </View>
          {data.observacoes ? (
            <>
              <Text style={styles.label}>Observações</Text>
              <Text style={styles.paragraph}>{data.observacoes}</Text>
            </>
          ) : null}
        </View>

        <Text style={styles.footer} fixed>
          {empresa.nome} · {empresa.cnpj} · {empresa.telefone} · {empresa.email}
        </Text>
      </Page>
    </Document>
  );
}
