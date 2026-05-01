import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, empresaFallback } from "./styles";

type Empresa = {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
};

export type ContratoPDFData = {
  numero: string;
  createdAt: Date | string;
  cliente: {
    nome: string;
    tipo: string;
    documento: string;
    endereco?: string | null;
  };
  valor: number;
  condicaoPagamento: string;
  prazoExecucao: string;
  garantiaMeses: number;
  escopo: string;
  obrigacoesCliente?: string | null;
  obrigacoesEmpresa?: string | null;
  clausulasExtras?: string | null;
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

export function ContratoPDF({ data }: { data: ContratoPDFData }) {
  const empresa = { ...empresaFallback, ...(data.empresa ?? {}) };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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

        <Text style={styles.title}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</Text>
        <Text style={styles.subtitle}>
          Nº {data.numero} · {fmtDate(data.createdAt)}
        </Text>

        {/* Partes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cláusula 1ª — Das partes</Text>
          <Text style={styles.paragraph}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>CONTRATADA: </Text>
            {empresa.nome}, inscrita no CNPJ sob o nº {empresa.cnpj}, com sede em{" "}
            {empresa.endereco}.
          </Text>
          <Text style={[styles.paragraph, { marginTop: 4 }]}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>CONTRATANTE: </Text>
            {data.cliente.nome} ({data.cliente.tipo}), inscrito(a) no{" "}
            {data.cliente.tipo === "PJ" ? "CNPJ" : "CPF"} sob o nº {data.cliente.documento}
            {data.cliente.endereco ? `, residente em ${data.cliente.endereco}` : ""}.
          </Text>
        </View>

        {/* Escopo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cláusula 2ª — Do objeto</Text>
          <Text style={styles.paragraph}>{data.escopo}</Text>
        </View>

        {/* Valor & condições */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cláusula 3ª — Do valor e condições de pagamento</Text>
          <Text style={styles.paragraph}>
            O valor total dos serviços é de{" "}
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{fmtCurrency(data.valor)}</Text>, a
            ser pago conforme a seguinte condição: {data.condicaoPagamento}.
          </Text>
        </View>

        {/* Prazo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cláusula 4ª — Do prazo de execução</Text>
          <Text style={styles.paragraph}>
            O prazo para execução dos serviços é de {data.prazoExecucao}, contado a partir da
            data de início acordada entre as partes.
          </Text>
        </View>

        {/* Garantia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cláusula 5ª — Da garantia</Text>
          <Text style={styles.paragraph}>
            A CONTRATADA garante os serviços executados pelo prazo de {data.garantiaMeses} meses,
            contado a partir da data de conclusão da obra, observadas as condições de uso e
            manutenção previstas no termo de garantia.
          </Text>
        </View>

        {/* Obrigações cliente */}
        {data.obrigacoesCliente ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cláusula 6ª — Obrigações do CONTRATANTE</Text>
            <Text style={styles.paragraph}>{data.obrigacoesCliente}</Text>
          </View>
        ) : null}

        {/* Obrigações empresa */}
        {data.obrigacoesEmpresa ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cláusula 7ª — Obrigações da CONTRATADA</Text>
            <Text style={styles.paragraph}>{data.obrigacoesEmpresa}</Text>
          </View>
        ) : null}

        {/* Cláusulas extras */}
        {data.clausulasExtras ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cláusulas adicionais</Text>
            <Text style={styles.paragraph}>{data.clausulasExtras}</Text>
          </View>
        ) : null}

        {/* Assinaturas */}
        <View style={styles.signatureRow} wrap={false}>
          <View style={styles.signatureBox}>
            <Text>{data.cliente.nome}</Text>
            <Text>CONTRATANTE</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>{empresa.nome}</Text>
            <Text>CONTRATADA</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          {empresa.nome} · {empresa.cnpj} · {empresa.telefone} · {empresa.email}
        </Text>
      </Page>
    </Document>
  );
}
