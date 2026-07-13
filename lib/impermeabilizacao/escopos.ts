/**
 * Escopos técnicos padrão por sistema de impermeabilização.
 * O vendedor insere com 1 clique nas observações do orçamento — o texto
 * aparece na proposta que a construtora vê, deixando ela completa e técnica.
 *
 * Verus vende MÃO DE OBRA (aplicação) — material fornecido pela obra.
 * Base: ABNT NBR 9575 (projeto) e 9574 (execução).
 */

export interface EscopoPadrao {
  id: string;
  nome: string;
  aplicacao: string;
  texto: string;
}

const RODAPE_MO = "Escopo: MÃO DE OBRA de aplicação. Material impermeabilizante fornecido pela obra/contratante.";
const GARANTIA = "Garantia: 5 anos contra infiltração sobre o serviço de aplicação executado.";

export const ESCOPOS: EscopoPadrao[] = [
  {
    id: "manta-asfaltica",
    nome: "Manta asfáltica (laje/cobertura)",
    aplicacao: "Lajes de cobertura, terraços e áreas expostas",
    texto: [
      "SISTEMA: Aplicação de manta asfáltica (ABNT NBR 9575/9574).",
      "• Preparo do substrato: limpeza e conferência de caimento para os ralos.",
      "• Aplicação de primer asfáltico.",
      "• Aplicação da manta com maçarico, sobreposição mínima de 10 cm e subida de 30 cm nas paredes/rodapés.",
      "• Reforço em ralos, cantos e tubulações.",
      "• Teste de estanqueidade (lâmina d'água 72h).",
      RODAPE_MO,
      GARANTIA,
    ].join("\n"),
  },
  {
    id: "membrana-poliuretano",
    nome: "Membrana líquida / poliuretano (varanda/molhado)",
    aplicacao: "Varandas, sacadas, banheiros, áreas molhadas",
    texto: [
      "SISTEMA: Aplicação de membrana líquida (poliuretano/acrílica) (ABNT NBR 9575/9574).",
      "• Preparo do substrato: limpeza e conferência de caimento.",
      "• Aplicação de 3 demãos com tela de reforço em cantos e ralos.",
      "• Subida de 30 cm nas paredes (área molhada) e 1,50 m no box de chuveiro.",
      "• Teste de estanqueidade antes do revestimento.",
      RODAPE_MO,
      GARANTIA,
    ].join("\n"),
  },
  {
    id: "reservatorio",
    nome: "Reservatório / caixa d'água",
    aplicacao: "Reservatórios, cisternas, caixas d'água",
    texto: [
      "SISTEMA: Aplicação de argamassa polimérica flexível em reservatório (ABNT NBR 9575 e 12170).",
      "• Preparo: limpeza, remoção de partes soltas e saturação.",
      "• Aplicação de 3 demãos cruzadas no fundo e paredes (altura cheia da lâmina d'água).",
      "• Tela de reforço em cantos e encontros piso/parede.",
      "• Cura úmida e teste de estanqueidade.",
      RODAPE_MO,
      GARANTIA,
    ].join("\n"),
  },
  {
    id: "piscina",
    nome: "Piscina",
    aplicacao: "Piscinas e espelhos d'água",
    texto: [
      "SISTEMA: Aplicação de argamassa polimérica flexível em piscina (ABNT NBR 9575).",
      "• Preparo do substrato e conferência de caimentos.",
      "• Aplicação de 3 demãos cruzadas no fundo e paredes (altura da lâmina).",
      "• Reforço com tela em cantos, ralos de fundo e tubulações.",
      "• Teste de estanqueidade antes do acabamento.",
      RODAPE_MO,
      GARANTIA,
    ].join("\n"),
  },
  {
    id: "cimenticio-box",
    nome: "Cimentício rígido (box/subsolo)",
    aplicacao: "Box de chuveiro, subsolos, muros de arrimo, contenção",
    texto: [
      "SISTEMA: Aplicação de impermeabilizante cimentício rígido/cristalizante (ABNT NBR 9575/9574).",
      "• Preparo do substrato: limpeza e saturação.",
      "• Aplicação de 2 a 3 demãos.",
      "• Tratamento de juntas e passagem de tubulações.",
      "• Adequado para pressão negativa (subsolo/contenção).",
      RODAPE_MO,
      GARANTIA,
    ].join("\n"),
  },
];

export function escopoPorId(id: string): EscopoPadrao | undefined {
  return ESCOPOS.find((e) => e.id === id);
}
