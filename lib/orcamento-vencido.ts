/** Orçamento vencido = passou da validade e ainda não foi decidido. */
export function orcamentoVencido(status: string, dataValidade: string | Date | null | undefined): boolean {
  if (!dataValidade) return false;
  if (status === "APROVADO" || status === "RECUSADO") return false;
  return new Date(dataValidade).getTime() < Date.now();
}

/** Status a exibir (marca VENCIDO derivado, sem alterar o banco). */
export function statusExibido(status: string, dataValidade: string | Date | null | undefined): string {
  return orcamentoVencido(status, dataValidade) ? "VENCIDO" : status;
}
