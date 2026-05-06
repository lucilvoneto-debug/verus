import { StyleSheet } from "@react-pdf/renderer";

// Brand colors (Verus — azul petróleo)
export const brand = {
  primary: "#0F5E7E",
  primaryDark: "#0A4258",
  primaryLight: "#E1EDF2",
  dark: "#0A4258",
  text: "#111827",
  muted: "#6B7280",
  border: "#D1D5DB",
  bgSoft: "#F9FAFB",
  white: "#FFFFFF",
};

export const empresaFallback = {
  nome: "Verus Impermeabilizações",
  cnpj: "—",
  endereco: "—",
  telefone: "(82) 99166-9449 | (82) 99673-0005",
  email: "verusimpermeabilizacoes@gmail.com",
};

export const styles = StyleSheet.create({
  page: {
    paddingTop: 110,
    paddingBottom: 80,
    paddingHorizontal: 50,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: brand.text,
    position: "relative",
  },
  // Diagonal blue stripe top-right
  stripeTop: {
    position: "absolute",
    top: -120,
    right: -180,
    width: 380,
    height: 240,
    backgroundColor: brand.primary,
    transform: "rotate(-25deg)",
  },
  // Diagonal blue stripe bottom-left
  stripeBottom: {
    position: "absolute",
    bottom: -100,
    left: -180,
    width: 380,
    height: 200,
    backgroundColor: brand.primary,
    transform: "rotate(-25deg)",
    opacity: 0.85,
  },
  // Watermark V (subtle, bottom-right)
  watermarkV: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 120,
    height: 120,
    opacity: 0.06,
  },
  // Logo header centered
  logoBlock: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  logoImage: {
    width: 70,
    height: 70,
    objectFit: "contain",
  },
  brandName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: brand.primary,
    marginTop: 2,
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginBottom: 12,
    textAlign: "center",
  },
  intro: {
    fontSize: 11,
    lineHeight: 1.5,
    color: brand.text,
    marginBottom: 20,
  },
  // Header data lines (Data, Obra, Cliente, etc)
  headerData: {
    marginBottom: 20,
  },
  headerLine: {
    fontSize: 11,
    marginBottom: 4,
    color: brand.text,
    flexDirection: "row",
  },
  headerLabel: {
    fontFamily: "Helvetica-Bold",
  },
  // Section titles (DESCRIÇÃO DOS SERVIÇOS, etc)
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginTop: 8,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  // Bordered box for service list
  servicesBox: {
    borderWidth: 1,
    borderColor: brand.text,
    padding: 12,
    marginBottom: 18,
  },
  serviceItem: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 2,
    color: brand.text,
  },
  // Service detail block (Title bar + 3 rows)
  serviceBlock: {
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: brand.muted,
  },
  serviceBlockTitle: {
    backgroundColor: brand.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    borderBottomWidth: 0.5,
    borderBottomColor: brand.muted,
  },
  serviceBlockRow: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 0.5,
    borderBottomColor: brand.muted,
    color: brand.text,
  },
  serviceBlockRowLast: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
  },
  // Page 2 sections
  termSection: {
    marginBottom: 18,
  },
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
  // Signatures
  signaturesArea: {
    marginTop: 60,
    alignItems: "center",
  },
  signatureLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.text,
    marginTop: 30,
    marginBottom: 4,
  },
  signatureLine: {
    width: 280,
    borderBottomWidth: 1,
    borderBottomColor: brand.text,
    height: 1,
    marginTop: 20,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 9,
    color: brand.text,
  },
  footerLine: {
    fontSize: 9,
    color: brand.text,
    marginBottom: 2,
    textAlign: "center",
  },
  // Total summary box (final do orçamento)
  totalBox: {
    marginTop: 12,
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
  totalLabel: {
    fontSize: 11,
    color: brand.text,
  },
  totalValue: {
    fontSize: 11,
    color: brand.text,
  },
  totalFinalLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: brand.primaryDark,
  },
  totalFinalValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: brand.primaryDark,
  },
  // Legacy styles (used by Contrato e Certificado)
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
  subtitle: {
    fontSize: 10,
    color: brand.muted,
    textAlign: "center",
    marginBottom: 16,
  },
  section: {
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.5,
    color: brand.text,
  },
  label: {
    fontSize: 8,
    color: brand.muted,
    textTransform: "uppercase",
    marginBottom: 1,
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
  // Certificate-specific (kept for garantia)
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
