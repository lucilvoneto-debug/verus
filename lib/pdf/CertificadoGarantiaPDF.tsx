import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, empresaFallback } from "./styles";

type Empresa = {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
};

export type CertificadoGarantiaPDFData = {
  cliente: { nome: string };
  obra: { numero: string; nome: string; endereco: string };
  dataInicio: Date | string;
  dataFim: Date | string;
  prazoMeses: number;
  tipoGarantia: string;
  condicoes?: string | null;
  empresa?: Partial<Empresa>;
};

function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR");
}

export function CertificadoGarantiaPDF({ data }: { data: CertificadoGarantiaPDFData }) {
  const empresa = { ...empresaFallback, ...(data.empresa ?? {}) };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.certificateBorder}>
          <View style={styles.certInner}>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.brandMark, { fontSize: 28 }]}>VERUS</Text>
              <Text style={styles.brandSub}>Impermeabilizações</Text>
            </View>

            <Text style={styles.certTitle}>CERTIFICADO</Text>
            <Text style={styles.certSubtitle}>DE GARANTIA</Text>

            <Text style={styles.certBody}>A {empresa.nome} certifica que</Text>
            <Text style={styles.certHighlight}>{data.cliente.nome}</Text>

            <Text style={styles.certBody}>
              é beneficiário(a) da garantia dos serviços de impermeabilização executados na obra
            </Text>
            <Text style={styles.certHighlight}>
              {data.obra.numero} — {data.obra.nome}
            </Text>
            <Text style={[styles.certBody, { fontSize: 10 }]}>{data.obra.endereco}</Text>

            <View style={{ marginTop: 16 }}>
              <Text style={styles.certBody}>
                Tipo:{" "}
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.tipoGarantia}</Text>
              </Text>
              <Text style={styles.certBody}>
                Prazo:{" "}
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.prazoMeses} meses</Text> ·
                Vigência: {fmtDate(data.dataInicio)} a {fmtDate(data.dataFim)}
              </Text>
            </View>

            {data.condicoes ? (
              <View style={{ marginTop: 14 }}>
                <Text
                  style={[
                    styles.label,
                    { textAlign: "center", fontSize: 9 },
                  ]}
                >
                  Condições
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    color: "#374151",
                    textAlign: "center",
                    lineHeight: 1.5,
                  }}
                >
                  {data.condicoes}
                </Text>
              </View>
            ) : null}

            <View style={{ marginTop: "auto", flexDirection: "row", justifyContent: "center" }}>
              <View
                style={{
                  width: 260,
                  borderTopWidth: 1,
                  borderTopColor: "#111827",
                  paddingTop: 4,
                  textAlign: "center",
                }}
              >
                <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold" }}>{empresa.nome}</Text>
                <Text style={{ fontSize: 8, color: "#6B7280" }}>CNPJ: {empresa.cnpj}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
