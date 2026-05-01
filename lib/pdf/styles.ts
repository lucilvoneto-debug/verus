import { StyleSheet } from "@react-pdf/renderer";

// Brand colors (Verus / Retric)
export const brand = {
  primary: "#C8102E",
  primaryDark: "#9B0B20",
  primaryLight: "#FDEAED",
  dark: "#0D0406",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  bgSoft: "#F9FAFB",
};

export const empresaFallback = {
  nome: "Verus Impermeabilizações",
  cnpj: "—",
  endereco: "—",
  telefone: "—",
  email: "—",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: brand.text,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: brand.primary,
    paddingBottom: 12,
    marginBottom: 16,
  },
  brandBlock: {
    flexDirection: "column",
  },
  brandMark: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: brand.primary,
    letterSpacing: 2,
  },
  brandSub: {
    fontSize: 8,
    color: brand.muted,
    marginTop: 2,
  },
  empresaBlock: {
    fontSize: 8,
    color: brand.muted,
    textAlign: "right",
  },
  empresaNome: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: brand.dark,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: brand.dark,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 10,
    color: brand.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: brand.primaryDark,
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: brand.text,
  },
  row: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: brand.muted,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  value: {
    fontSize: 10,
    color: brand.text,
    marginBottom: 6,
  },
  // Tables
  table: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: brand.border,
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: brand.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: brand.primary,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: brand.primaryDark,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: brand.border,
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableCell: {
    fontSize: 9,
    color: brand.text,
  },
  totals: {
    marginTop: 8,
    alignSelf: "flex-end",
    width: "50%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: {
    fontSize: 10,
    color: brand.muted,
  },
  totalsValue: {
    fontSize: 10,
    color: brand.text,
  },
  totalFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: brand.primary,
  },
  totalFinalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: brand.primaryDark,
  },
  totalFinalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: brand.primaryDark,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: brand.muted,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: brand.border,
    paddingTop: 8,
  },
  signatureRow: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    borderTopWidth: 1,
    borderTopColor: brand.text,
    paddingTop: 4,
    fontSize: 9,
    textAlign: "center",
    color: brand.muted,
  },
  // Certificate-specific
  certificateBorder: {
    borderWidth: 4,
    borderColor: brand.primary,
    padding: 24,
    height: "100%",
  },
  certInner: {
    borderWidth: 1,
    borderColor: brand.primaryDark,
    padding: 24,
    height: "100%",
    flexDirection: "column",
  },
  certTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: brand.primaryDark,
    textAlign: "center",
    marginTop: 20,
    letterSpacing: 4,
  },
  certSubtitle: {
    fontSize: 12,
    color: brand.muted,
    textAlign: "center",
    marginBottom: 30,
    letterSpacing: 2,
  },
  certBody: {
    fontSize: 12,
    lineHeight: 1.8,
    textAlign: "center",
    marginVertical: 8,
  },
  certHighlight: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: brand.primaryDark,
    textAlign: "center",
    marginVertical: 4,
  },
});
