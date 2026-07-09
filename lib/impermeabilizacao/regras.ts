/**
 * Motor de regras de quantitativo de impermeabilização.
 *
 * Base normativa: ABNT NBR 9575 (seleção e projeto) e NBR 9574 (execução).
 * Fórmula geral por ambiente:
 *
 *   Área total = Área de piso + (Perímetro × Altura de subida) + Área de box
 *
 * A altura de subida na parede depende da FUNÇÃO do ambiente:
 *   - área molhada (banheiro/copa/serviço/vestiário): rodapé 0,30 m
 *   - box de chuveiro: 1,50 m (medido à parte, por metro linear de parede de box)
 *   - reservatório/piscina/caixa d'água: altura cheia da lâmina d'água
 *   - varanda/sacada: rodapé 0,30 m
 *   - laje de cobertura: platibanda 0,30 m
 *   - área seca / laje técnica: só piso (rodapé 0)
 *
 * Tudo é determinístico e testável — nenhum valor sai daqui sem regra.
 */

export type TipoAmbiente =
  | "AREA_MOLHADA"
  | "BOX_CHUVEIRO"
  | "RESERVATORIO"
  | "PISCINA"
  | "CAIXA_DAGUA"
  | "VARANDA"
  | "LAJE_COBERTURA"
  | "CAMARA_FRIGORIFICA"
  | "AREA_SECA"
  | "LAJE_TECNICA";

export interface RegraTipo {
  tipo: TipoAmbiente;
  label: string;
  /** Altura de subida de rodapé padrão (m). Reservatório usa altura real do ambiente. */
  alturaPadrao: number;
  /** Mínimo exigido pela norma (m) — usado só pra avisar, nunca pra baixar o valor. */
  minimoNorma: number;
  /** Se true, a "altura" é a altura cheia da lâmina (usuário informa a real). */
  usaAlturaReal: boolean;
  /** Ambiente costuma ter box de chuveiro. */
  aceitaBox: boolean;
  /** Cor/etiqueta pra UI. */
  cor: string;
  nota: string;
}

export const ALTURA_BOX = 1.5; // m — NBR: box de chuveiro sobe 1,50 m

export const REGRAS: Record<TipoAmbiente, RegraTipo> = {
  AREA_MOLHADA: {
    tipo: "AREA_MOLHADA",
    label: "Área molhada (banheiro/copa/serviço)",
    alturaPadrao: 0.3,
    minimoNorma: 0.2,
    usaAlturaReal: false,
    aceitaBox: true,
    cor: "#2D7DD2",
    nota: "Piso + rodapé 0,30 m. Box de chuveiro somado à parte (1,50 m).",
  },
  BOX_CHUVEIRO: {
    tipo: "BOX_CHUVEIRO",
    label: "Box de chuveiro (isolado)",
    alturaPadrao: 1.5,
    minimoNorma: 1.5,
    usaAlturaReal: false,
    aceitaBox: false,
    cor: "#1D9E75",
    nota: "Região de água constante: sobe 1,50 m na parede.",
  },
  RESERVATORIO: {
    tipo: "RESERVATORIO",
    label: "Reservatório",
    alturaPadrao: 1.5,
    minimoNorma: 0,
    usaAlturaReal: true,
    aceitaBox: false,
    cor: "#0D6EFD",
    nota: "Fundo + paredes na altura cheia da lâmina d'água. Informe a altura real.",
  },
  PISCINA: {
    tipo: "PISCINA",
    label: "Piscina",
    alturaPadrao: 1.4,
    minimoNorma: 0,
    usaAlturaReal: true,
    aceitaBox: false,
    cor: "#0AA2C0",
    nota: "Fundo + paredes na altura da lâmina. Informe a profundidade real.",
  },
  CAIXA_DAGUA: {
    tipo: "CAIXA_DAGUA",
    label: "Caixa d'água / cisterna",
    alturaPadrao: 1.5,
    minimoNorma: 0,
    usaAlturaReal: true,
    aceitaBox: false,
    cor: "#0D6EFD",
    nota: "Fundo + paredes na altura cheia. Informe a altura real.",
  },
  VARANDA: {
    tipo: "VARANDA",
    label: "Varanda / sacada",
    alturaPadrao: 0.3,
    minimoNorma: 0.2,
    usaAlturaReal: false,
    aceitaBox: false,
    cor: "#F0A500",
    nota: "Piso + rodapé 0,30 m junto à alvenaria e guarda-corpo.",
  },
  LAJE_COBERTURA: {
    tipo: "LAJE_COBERTURA",
    label: "Laje de cobertura",
    alturaPadrao: 0.3,
    minimoNorma: 0.3,
    usaAlturaReal: false,
    aceitaBox: false,
    cor: "#6C757D",
    nota: "Piso + subida de 0,30 m em platibanda / arremate. Se platibanda ≤ 0,50 m, use altura real.",
  },
  CAMARA_FRIGORIFICA: {
    tipo: "CAMARA_FRIGORIFICA",
    label: "Câmara frigorífica",
    alturaPadrao: 0.3,
    minimoNorma: 0.2,
    usaAlturaReal: false,
    aceitaBox: false,
    cor: "#20C997",
    nota: "Área de lavagem/umidade (NÃO é reservatório): piso + rodapé 0,30 m.",
  },
  AREA_SECA: {
    tipo: "AREA_SECA",
    label: "Área seca (sem impermeabilização de parede)",
    alturaPadrao: 0,
    minimoNorma: 0,
    usaAlturaReal: false,
    aceitaBox: false,
    cor: "#ADB5BD",
    nota: "Somente piso, sem subida de rodapé.",
  },
  LAJE_TECNICA: {
    tipo: "LAJE_TECNICA",
    label: "Laje técnica / casa de máquinas",
    alturaPadrao: 0.3,
    minimoNorma: 0,
    usaAlturaReal: false,
    aceitaBox: false,
    cor: "#6C757D",
    nota: "Piso + rodapé 0,30 m de arremate.",
  },
};

export const TIPOS_LISTA: RegraTipo[] = Object.values(REGRAS);

/** Ambiente cru vindo do parser / da edição do usuário. */
export interface AmbienteEntrada {
  nome: string;
  /** Área de piso (m²). */
  areaPiso: number;
  /** Perímetro de parede a impermeabilizar (m). */
  perimetro: number;
  tipo: TipoAmbiente;
  /** Altura de subida em m. Se ausente, usa a regra do tipo. */
  altura?: number;
  /** Metros lineares de parede de box de chuveiro (só área molhada). */
  boxComprimento?: number;
  /** Quantidade de ambientes iguais (ex.: 12 banheiros de suíte idênticos). */
  repeticao?: number;
  /** Origem/observação (layer do DXF, aba da planilha, etc). */
  origem?: string;
}

export interface AmbienteCalculado extends AmbienteEntrada {
  alturaUsada: number;
  repeticaoUsada: number;
  areaRodape: number;
  areaBox: number;
  /** Área total de UM ambiente. */
  areaUnitaria: number;
  /** Área total × repetição. */
  areaTotal: number;
  /** Avisos (altura abaixo do mínimo da norma, dados faltando, etc). */
  avisos: string[];
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Calcula um ambiente aplicando a regra do seu tipo. */
export function calcularAmbiente(a: AmbienteEntrada): AmbienteCalculado {
  const regra = REGRAS[a.tipo];
  const avisos: string[] = [];

  const areaPiso = Math.max(0, a.areaPiso || 0);
  const perimetro = Math.max(0, a.perimetro || 0);
  const repeticao = Math.max(1, Math.floor(a.repeticao ?? 1));

  // Altura: override do usuário > regra do tipo.
  let altura = a.altura != null ? a.altura : regra.alturaPadrao;
  altura = Math.max(0, altura);

  if (regra.usaAlturaReal && (a.altura == null || a.altura <= 0)) {
    avisos.push(`Altura da lâmina não informada — usando ${regra.alturaPadrao.toFixed(2)} m como estimativa. Confirmar em obra.`);
  }
  if (regra.minimoNorma > 0 && altura > 0 && altura < regra.minimoNorma) {
    avisos.push(`Altura ${altura.toFixed(2)} m abaixo do mínimo NBR (${regra.minimoNorma.toFixed(2)} m).`);
  }
  if (areaPiso <= 0) avisos.push("Área de piso zerada.");
  if (altura > 0 && perimetro <= 0) avisos.push("Perímetro zerado — só o piso será impermeabilizado.");

  const areaRodape = round2(perimetro * altura);

  let boxComprimento = 0;
  let areaBox = 0;
  if (regra.aceitaBox && a.boxComprimento && a.boxComprimento > 0) {
    boxComprimento = a.boxComprimento;
    areaBox = round2(boxComprimento * ALTURA_BOX);
  } else if (!regra.aceitaBox && a.boxComprimento) {
    avisos.push("Box informado ignorado (tipo não aceita box).");
  }

  const areaUnitaria = round2(areaPiso + areaRodape + areaBox);
  const areaTotal = round2(areaUnitaria * repeticao);

  return {
    ...a,
    areaPiso,
    perimetro,
    boxComprimento,
    alturaUsada: altura,
    repeticaoUsada: repeticao,
    areaRodape,
    areaBox,
    areaUnitaria,
    areaTotal,
    avisos,
  };
}

export interface ResumoOrcamento {
  ambientes: AmbienteCalculado[];
  areaPisoTotal: number;
  areaRodapeTotal: number;
  areaBoxTotal: number;
  areaTotalGeral: number;
  /** Soma por tipo, pra tabela de sistemas. */
  porTipo: { tipo: TipoAmbiente; label: string; area: number; qtd: number }[];
  avisos: number;
}

/** Consolida a lista inteira. */
export function calcularOrcamento(entradas: AmbienteEntrada[]): ResumoOrcamento {
  const ambientes = entradas.map(calcularAmbiente);

  const areaPisoTotal = round2(ambientes.reduce((s, a) => s + a.areaPiso * a.repeticaoUsada, 0));
  const areaRodapeTotal = round2(ambientes.reduce((s, a) => s + a.areaRodape * a.repeticaoUsada, 0));
  const areaBoxTotal = round2(ambientes.reduce((s, a) => s + a.areaBox * a.repeticaoUsada, 0));
  const areaTotalGeral = round2(ambientes.reduce((s, a) => s + a.areaTotal, 0));

  const mapa = new Map<TipoAmbiente, { area: number; qtd: number }>();
  for (const a of ambientes) {
    const cur = mapa.get(a.tipo) ?? { area: 0, qtd: 0 };
    cur.area += a.areaTotal;
    cur.qtd += a.repeticaoUsada;
    mapa.set(a.tipo, cur);
  }
  const porTipo = Array.from(mapa.entries())
    .map(([tipo, v]) => ({ tipo, label: REGRAS[tipo].label, area: round2(v.area), qtd: v.qtd }))
    .sort((a, b) => b.area - a.area);

  const avisos = ambientes.reduce((s, a) => s + a.avisos.length, 0);

  return { ambientes, areaPisoTotal, areaRodapeTotal, areaBoxTotal, areaTotalGeral, porTipo, avisos };
}
