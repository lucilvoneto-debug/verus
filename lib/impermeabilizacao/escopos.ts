/**
 * Escopos técnicos padrão por sistema de impermeabilização.
 * O vendedor insere com 1 clique nas observações do orçamento — o texto
 * aparece na proposta que a construtora vê, deixando ela completa e técnica.
 * Base: ABNT NBR 9575 (projeto) e 9574 (execução).
 */

export interface EscopoPadrao {
  id: string;
  nome: string;
  aplicacao: string;
  texto: string;
}

export const ESCOPOS: EscopoPadrao[] = [
  {
    id: "manta-asfaltica",
    nome: "Manta asfáltica (laje/cobertura)",
    aplicacao: "Lajes de cobertura, terraços e áreas expostas",
    texto: [
      "SISTEMA: Impermeabilização com manta asfáltica (ABNT NBR 9575/9574).",
      "• Preparo do substrato: limpeza, regularização com argamassa e caimento mínimo de 1% para os ralos.",
      "• Aplicação de primer asfáltico em toda a superfície.",
      "• Aplicação de manta asfáltica 3 mm com maçarico, com sobreposição mínima de 10 cm e subida de 30 cm nas paredes/rodapés.",
      "• Reforço em ralos, cantos e tubulações.",
      "• Teste de estanqueidade (lâmina d'água 72h) antes da proteção mecânica.",
      "• Proteção mecânica com argamassa.",
      "GARANTIA: 5 anos contra infiltração no sistema aplicado.",
    ].join("\n"),
  },
  {
    id: "membrana-poliuretano",
    nome: "Membrana líquida / poliuretano (varanda/área molhada)",
    aplicacao: "Varandas, sacadas, banheiros, áreas molhadas",
    texto: [
      "SISTEMA: Impermeabilização com membrana líquida de poliuretano/acrílica (ABNT NBR 9575/9574).",
      "• Preparo do substrato: limpeza, correção de trincas e caimento para os ralos.",
      "• Aplicação de 3 demãos de membrana com tela de reforço nos cantos e ralos.",
      "• Subida de 30 cm nas paredes (área molhada) e 1,50 m no box de chuveiro.",
      "• Teste de estanqueidade antes do revestimento.",
      "GARANTIA: 5 anos contra infiltração no sistema aplicado.",
    ].join("\n"),
  },
  {
    id: "reservatorio",
    nome: "Reservatório / caixa d'água",
    aplicacao: "Reservatórios, cisternas, caixas d'água",
    texto: [
      "SISTEMA: Impermeabilização de reservatório com argamassa polimérica flexível (ABNT NBR 9575 e 12170 — água potável).",
      "• Preparo: limpeza, remoção de partes soltas e saturação da superfície.",
      "• Aplicação de argamassa polimérica em 3 demãos cruzadas no fundo e paredes (altura cheia da lâmina d'água).",
      "• Tela de reforço em cantos e encontros piso/parede.",
      "• Cura úmida e teste de estanqueidade.",
      "• Produto atóxico, próprio para contato com água de consumo.",
      "GARANTIA: 5 anos contra infiltração no sistema aplicado.",
    ].join("\n"),
  },
  {
    id: "piscina",
    nome: "Piscina",
    aplicacao: "Piscinas e espelhos d'água",
    texto: [
      "SISTEMA: Impermeabilização de piscina com argamassa polimérica flexível (ABNT NBR 9575).",
      "• Preparo do substrato e correção de caimentos.",
      "• Aplicação de argamassa polimérica em 3 demãos cruzadas no fundo e paredes (altura da lâmina).",
      "• Reforço com tela em cantos, ralos de fundo e tubulações.",
      "• Teste de estanqueidade antes do revestimento/acabamento.",
      "GARANTIA: 5 anos contra infiltração no sistema aplicado.",
    ].join("\n"),
  },
  {
    id: "cimenticio-box",
    nome: "Cimentício rígido (box/subsolo)",
    aplicacao: "Box de chuveiro, subsolos, muros de arrimo, contenção",
    texto: [
      "SISTEMA: Impermeabilização com cimentício rígido/cristalizante (ABNT NBR 9575/9574).",
      "• Preparo do substrato: limpeza e saturação.",
      "• Aplicação de argamassa cimentícia impermeabilizante em 2 a 3 demãos.",
      "• Tratamento de juntas e passagem de tubulações.",
      "• Adequado para pressão negativa (subsolo/contenção).",
      "GARANTIA: 5 anos contra infiltração no sistema aplicado.",
    ].join("\n"),
  },
];

export function escopoPorId(id: string): EscopoPadrao | undefined {
  return ESCOPOS.find((e) => e.id === id);
}
