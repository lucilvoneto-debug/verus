import { prisma } from "./prisma";

/** Entidades que aceitam anexo e como resolver nome + link de cada uma. */
export const ENTIDADES_ANEXO = [
  { chave: "Cliente", label: "Cliente", rota: "/dashboard/clientes" },
  { chave: "Obra", label: "Obra", rota: "/dashboard/obras" },
  { chave: "Contrato", label: "Contrato", rota: "/dashboard/contratos" },
  { chave: "Orcamento", label: "Orçamento", rota: "/dashboard/orcamento" },
  { chave: "Visita", label: "Visita técnica", rota: "/dashboard/visita" },
  { chave: "Lead", label: "Lead", rota: "/dashboard/crm" },
  { chave: "Fornecedor", label: "Fornecedor", rota: "/dashboard/fornecedores" },
  { chave: "Geral", label: "Geral (sem vínculo)", rota: "" },
] as const;

export type EntidadeAnexo = (typeof ENTIDADES_ANEXO)[number]["chave"];

export function entidadeValida(v: unknown): v is EntidadeAnexo {
  return typeof v === "string" && ENTIDADES_ANEXO.some((e) => e.chave === v);
}

/** Resolve "nome bonito" de cada entidade referenciada num lote de anexos. */
export async function rotularEntidades(
  pares: Array<{ entidade: string; entidadeId: string }>,
): Promise<Record<string, string>> {
  const porTipo = new Map<string, Set<string>>();
  for (const p of pares) {
    if (!porTipo.has(p.entidade)) porTipo.set(p.entidade, new Set());
    porTipo.get(p.entidade)!.add(p.entidadeId);
  }
  const out: Record<string, string> = {};
  const chave = (t: string, id: string) => `${t}:${id}`;

  const ids = (t: string) => Array.from(porTipo.get(t) ?? []);

  if (ids("Cliente").length) {
    const rows = await prisma.cliente.findMany({ where: { id: { in: ids("Cliente") } }, select: { id: true, nome: true } });
    rows.forEach((r) => (out[chave("Cliente", r.id)] = r.nome));
  }
  if (ids("Obra").length) {
    const rows = await prisma.obra.findMany({ where: { id: { in: ids("Obra") } }, select: { id: true, numero: true, nome: true } });
    rows.forEach((r) => (out[chave("Obra", r.id)] = `${r.numero} · ${r.nome}`));
  }
  if (ids("Contrato").length) {
    const rows = await prisma.contrato.findMany({ where: { id: { in: ids("Contrato") } }, select: { id: true, numero: true } });
    rows.forEach((r) => (out[chave("Contrato", r.id)] = r.numero));
  }
  if (ids("Orcamento").length) {
    const rows = await prisma.orcamento.findMany({ where: { id: { in: ids("Orcamento") } }, select: { id: true, numero: true } });
    rows.forEach((r) => (out[chave("Orcamento", r.id)] = r.numero));
  }
  if (ids("Visita").length) {
    const rows = await prisma.visita.findMany({ where: { id: { in: ids("Visita") } }, select: { id: true, endereco: true } });
    rows.forEach((r) => (out[chave("Visita", r.id)] = r.endereco));
  }
  if (ids("Lead").length) {
    const rows = await prisma.lead.findMany({ where: { id: { in: ids("Lead") } }, select: { id: true, nome: true, telefone: true } });
    rows.forEach((r) => (out[chave("Lead", r.id)] = r.nome ?? r.telefone ?? r.id));
  }
  if (ids("Fornecedor").length) {
    const rows = await prisma.fornecedor.findMany({ where: { id: { in: ids("Fornecedor") } }, select: { id: true, nome: true } });
    rows.forEach((r) => (out[chave("Fornecedor", r.id)] = r.nome));
  }
  return out;
}
