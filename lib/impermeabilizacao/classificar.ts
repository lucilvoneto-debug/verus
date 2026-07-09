import type { TipoAmbiente } from "./regras";

/**
 * Palpite de tipo de ambiente a partir do nome (label do DXF / linha da planilha).
 * É só um chute inicial — o usuário confirma/ajusta na tela antes de gerar o orçamento.
 */

const REGRAS_NOME: { tipo: TipoAmbiente; termos: string[] }[] = [
  { tipo: "RESERVATORIO", termos: ["reservatorio", "rsi", "rss", "barrilete", "cisterna inferior"] },
  { tipo: "CAIXA_DAGUA", termos: ["caixa d", "caixa agua", "cisterna", "poco artesiano"] },
  { tipo: "PISCINA", termos: ["piscina", "espelho d", "deck molhado", "prainha", "borda infinita"] },
  { tipo: "CAMARA_FRIGORIFICA", termos: ["camara fria", "camara frigor", "frigorif", "freezer", "resfriado", "antecamara"] },
  { tipo: "BOX_CHUVEIRO", termos: ["box de chuveiro", "box chuveiro", "boxe"] },
  { tipo: "LAJE_COBERTURA", termos: ["cobertura", "coberta", "laje de cobert", "telhado", "platibanda", "marquise", "beiral"] },
  { tipo: "LAJE_TECNICA", termos: ["casa de maquina", "shaft", "poco de elevador", "gerador", "laje tecnica", "duto"] },
  { tipo: "VARANDA", termos: ["varanda", "sacada", "terraco", "balcao", "gourmet"] },
  {
    tipo: "AREA_MOLHADA",
    termos: [
      "banheiro", "bwc", "wc", "sanitario", "lavabo", "vestiario",
      "copa", "cozinha", "area de servico", "lavanderia", "rouparia",
      "dml", "deposito de limpeza", "chuveiro", "ducha", "molhad", "suite",
      "apto", "apartamento", "quarto molhado",
    ],
  },
  { tipo: "AREA_SECA", termos: ["seca", "hall", "corredor seco", "sala", "escritorio", "recepcao seca"] },
];

/** Remove acentos (combining diacritics U+0300–U+036F) e baixa caixa. */
function normalizar(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function classificarNome(nome: string): TipoAmbiente {
  const n = normalizar(nome);

  for (const { tipo, termos } of REGRAS_NOME) {
    for (const t of termos) {
      if (n.includes(normalizar(t))) return tipo;
    }
  }
  // Sem palpite: área molhada é o caso mais comum e conservador em impermeabilização.
  return "AREA_MOLHADA";
}
