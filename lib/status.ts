type Tone = "blue" | "green" | "yellow" | "red" | "neutral";

export function obraStatusTone(status: string): Tone {
  switch (status) {
    case "EM_ANDAMENTO":
      return "blue";
    case "FINALIZADA":
      return "green";
    case "ATRASADA":
      return "red";
    case "PAUSADA":
      return "yellow";
    case "CANCELADA":
      return "red";
    case "AGUARDANDO":
    default:
      return "neutral";
  }
}

export function obraStatusLabel(status: string): string {
  return (
    {
      AGUARDANDO: "Aguardando",
      EM_ANDAMENTO: "Em andamento",
      PAUSADA: "Pausada",
      ATRASADA: "Atrasada",
      FINALIZADA: "Finalizada",
      CANCELADA: "Cancelada",
    } as Record<string, string>
  )[status] ?? status;
}

export function etapaStatusTone(status: string): Tone {
  switch (status) {
    case "EM_ANDAMENTO":
      return "blue";
    case "CONCLUIDA":
      return "green";
    case "ATRASADA":
      return "red";
    case "PENDENTE":
    default:
      return "neutral";
  }
}

export function etapaStatusLabel(status: string): string {
  return (
    {
      PENDENTE: "Pendente",
      EM_ANDAMENTO: "Em andamento",
      CONCLUIDA: "Concluída",
      ATRASADA: "Atrasada",
    } as Record<string, string>
  )[status] ?? status;
}

export function medicaoStatusTone(status: string): Tone {
  switch (status) {
    case "APROVADA":
      return "blue";
    case "FATURADA":
      return "green";
    case "PENDENTE":
    default:
      return "yellow";
  }
}

export function medicaoStatusLabel(status: string): string {
  return (
    {
      PENDENTE: "Pendente",
      APROVADA: "Aprovada",
      FATURADA: "Faturada",
    } as Record<string, string>
  )[status] ?? status;
}

// ─── Atendimento ─────────────────────────────────────────────────────────────

export function atendimentoStatusTone(s: string): "blue" | "green" | "yellow" | "red" | "neutral" {
  if (s === "ABERTO") return "blue";
  if (s === "EM_ANDAMENTO") return "yellow";
  if (s === "AGUARDANDO_CLIENTE") return "neutral";
  if (s === "RESOLVIDO") return "green";
  return "red";
}

export function urgenciaTone(u: string): "blue" | "green" | "yellow" | "red" | "neutral" {
  if (u === "ALTA") return "red";
  if (u === "MEDIA") return "yellow";
  return "neutral";
}
