export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AGUARDANDO: "badge-neutral",
    EM_ANDAMENTO: "badge-yellow",
    PAUSADA: "badge-red",
    FINALIZADA: "badge-green",
    CONCLUIDA: "badge-green",
    PENDENTE: "badge-neutral",
  };
  const cls = map[status] || "badge-neutral";
  return <span className={cls}>{status.replaceAll("_", " ")}</span>;
}
