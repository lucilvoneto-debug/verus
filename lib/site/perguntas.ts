/**
 * Perguntas e respostas do site (landing e páginas por serviço).
 *
 * As perguntas seguem o que o cliente digita no Google (autocomplete conferido em 17/11/2026:
 * "quanto custa impermeabilizar laje", "manta asfáltica ou manta líquida", "impermeabilização
 * dura quanto tempo", "infiltração na laje o que fazer", "impermeabilização caixa d'água
 * concreto", "impermeabilizar piscina de alvenaria", "impermeabilização banheiro apartamento",
 * "como saber se a impermeabilização é boa"...).
 *
 * Regra: `r` é a resposta direta (40–60 palavras), `d` é o detalhe curto. Só usar o que a
 * landing já afirma (lib/site/empresa.ts), o escopo padrão das propostas
 * (lib/impermeabilizacao/escopos.ts e regras.ts) ou conhecimento técnico geral.
 * O escopo diz "garantia 5 anos" e "material fornecido pela obra": NÃO publicar sem o dono
 * confirmar. Não acrescentar preço,
 * garantia em anos, prazo, número de obras ou tempo de mercado sem o dono confirmar.
 * O mesmo texto vai para o HTML visível e para o JSON-LD (FAQPage): não duplicar em outro lugar.
 */
import { AREAS, EMPRESA } from "@/lib/site/empresa";

export type Pergunta = { p: string; r: string; d?: string };

/** Data da última revisão real das respostas. Atualizar só quando o texto mudar. */
export const REVISADO_EM = "2026-11-17";

const OUTRAS_CIDADES = AREAS.filter((a) => a !== EMPRESA.cidade);

export const PERGUNTAS = {
  oQueE: {
    p: "O que é impermeabilização?",
    r: `Impermeabilização é o conjunto de camadas aplicadas sobre laje, parede, piso, piscina ou reservatório para impedir que a água atravesse a estrutura. Ela protege o concreto e a armadura, evita mofo, goteira e mancha e, em obra nova, é feita antes do acabamento. A ${EMPRESA.nome} faz esse serviço em ${EMPRESA.cidade} e em mais ${OUTRAS_CIDADES.length} cidades de Alagoas.`,
    d: "O sistema muda conforme a área: manta asfáltica, poliureia, cimentício, poliuretano, membrana acrílica ou hidrofugante. Em toda área, a Verus faz o teste de estanqueidade antes de liberar a próxima etapa da obra.",
  },
  custoLaje: {
    p: "Quanto custa impermeabilizar uma laje em Maceió?",
    r: "O preço é calculado por metro quadrado e só sai depois da visita técnica, que não tem custo. O valor depende do tamanho da laje, do sistema indicado, do estado da superfície e de detalhes como ralos, rufos e muretas. A proposta traz sistema, quantitativo, prazo de execução e garantia por escrito.",
    d: "Laje com impermeabilização antiga solta, sem caimento ou com piso por cima costuma exigir mais preparação, e isso entra no orçamento. Por isso a Verus não divulga preço fechado sem ver a área.",
  },
  custoReservatorio: {
    p: "Quanto custa impermeabilizar caixa d'água ou piscina?",
    r: "Também é orçado por metro quadrado, depois da visita técnica sem custo. Entram no cálculo o tamanho, o material da estrutura (concreto ou alvenaria), se há vazamento ativo, se é preciso remover revestimento e o sistema indicado. A liberação só acontece depois do teste de enchimento, e a garantia vai por escrito no contrato.",
  },
  mantaOuLiquida: {
    p: "Manta asfáltica ou manta líquida: qual é melhor para laje?",
    r: "Não existe uma melhor em todos os casos. A manta asfáltica é indicada para lajes e coberturas com grande movimentação térmica. A manta líquida (membrana acrílica ou poliuretano) é aplicada sem emendas: a acrílica serve para lajes com trânsito leve e reflete calor; o poliuretano acompanha fissuras e movimento. A escolha depende da laje.",
    d: "Na visita, a Verus avalia exposição ao sol e à chuva, tráfego sobre a laje, fissuras e caimento antes de indicar o sistema. A poliureia, aplicada a quente e sem emenda, é outra opção para coberturas.",
  },
  duracao: {
    p: "Quanto tempo dura a impermeabilização?",
    r: "A durabilidade depende de quatro coisas: o sistema escolhido para aquela área, a preparação da superfície, a proteção do sistema contra sol e tráfego, e a manutenção ao longo dos anos. Por isso a Verus não promete um número genérico: a garantia de cada serviço vai por escrito no contrato e no termo de garantia.",
    d: "Sinais de que a impermeabilização chegou ao fim: manta ressecada ou descolando, fissuras na superfície, ralo vazando e mancha no teto depois da chuva.",
  },
  infiltracaoLaje: {
    p: "Infiltração na laje é perigoso? O que fazer?",
    r: "Merece atenção. A água que atravessa a laje pode enferrujar a armadura do concreto, soltar o reboco e causar mofo. O primeiro passo é descobrir de onde a água entra, porque pintar por baixo não resolve. A Verus faz a visita técnica sem custo, identifica a causa e propõe o reparo com garantia por escrito.",
    d: "Se aparecer ferragem exposta, trinca grande ou concreto se soltando, peça também a avaliação de um engenheiro estrutural antes do reparo.",
  },
  infiltracaoOuUmidade: {
    p: "Como saber se é infiltração ou só umidade?",
    r: "Mancha que cresce depois da chuva, bolha ou descascado na tinta, cheiro de mofo, reboco esfarelando e goteira são sinais de infiltração. Umidade de condensação costuma aparecer em cantos frios e diminui com ventilação. Na visita técnica, sem custo, a Verus identifica a origem da água antes de propor qualquer serviço.",
  },
  infiltracaoParede: {
    p: "Infiltração na parede: o que fazer?",
    r: "Primeiro, descobrir a origem. As causas mais comuns são chuva de vento entrando pela fachada, umidade que sobe do solo pela base da parede, vazamento de tubulação e água vinda da laje ou do vizinho. Cada causa pede um tratamento diferente, e só pintar por cima não resolve: a mancha volta.",
    d: "Na fachada, a Verus trata fissuras e aplica hidrofugante; na base da parede, faz barreira contra a umidade que sobe do solo. A causa é confirmada na visita técnica, sem custo.",
  },
  caixaDagua: {
    p: "Como é feita a impermeabilização de caixa d'água de concreto?",
    r: "A caixa d'água é esvaziada e limpa, as partes soltas são removidas e a superfície é saturada com água. No escopo padrão da Verus, ela recebe argamassa polimérica flexível em três demãos cruzadas no fundo e nas paredes, na altura cheia da lâmina d'água, com tela de reforço nos cantos. Depois vêm a cura úmida e o teste de estanqueidade.",
    d: "A Verus atende caixa d'água, cisterna e reservatório de condomínio. O prazo de execução vai na proposta, depois da visita técnica.",
  },
  piscina: {
    p: "Como impermeabilizar piscina de alvenaria ou concreto?",
    r: "A piscina é esvaziada, a superfície é preparada e os caimentos são conferidos. No escopo padrão da Verus, ela recebe argamassa polimérica flexível em três demãos cruzadas no fundo e nas paredes, até a altura da lâmina d'água, com tela de reforço em cantos, ralos de fundo e tubulações. O teste de estanqueidade é feito antes do acabamento.",
    d: "Sinais de que a piscina precisa de impermeabilização: nível baixando mais do que a evaporação explica, terreno úmido em volta e pastilha ou azulejo soltando.",
  },
  quebrarPiso: {
    p: "Precisa quebrar o piso para impermeabilizar?",
    r: "Nem sempre. Em laje e cobertura, a aplicação costuma ser feita sobre a superfície preparada. Em banheiro, varanda ou sacada já prontos, a Verus avalia na visita o menor caminho para corrigir a infiltração, com abertura mínima. Em obra nova, o certo é impermeabilizar a área molhada antes do piso, para não quebrar depois.",
  },
  banheiro: {
    p: "Como impermeabilizar banheiro de apartamento?",
    r: "No banheiro, a impermeabilização é feita sobre o contrapiso, antes do revestimento, subindo pelas paredes como um rodapé e reforçada no box, no ralo e na soleira. Antes de assentar o piso, a área recebe teste com lâmina d'água. Se o banheiro já está pronto e vazando para o vizinho, a correção começa pela visita técnica.",
    d: "O mesmo cuidado vale para varanda e sacada: caimento para o ralo, detalhe na soleira da porta e teste antes do piso.",
  },
  garantia: {
    p: "A impermeabilização tem garantia?",
    r: "Sim. Na Verus, a garantia vai por escrito no contrato e, ao final da obra, você recebe o termo de garantia em PDF, junto com o relatório fotográfico e o registro do teste de estanqueidade. As condições da garantia vêm descritas na proposta, antes de você fechar.",
    d: "Depois da entrega há acompanhamento pós-obra, e o termo de garantia fica disponível no portal do cliente.",
  },
  bemFeita: {
    p: "Como saber se a impermeabilização foi bem feita?",
    r: "Pelo teste de estanqueidade. Antes de liberar a área, a Verus mantém uma lâmina d'água sobre laje e área molhada, ou enche o reservatório e a piscina, e confere se aparece umidade ou vazamento embaixo. O teste vai documentado no relatório. Também conta a preparação: superfície limpa, regularizada e com caimento para o ralo.",
  },
  orcamento: {
    p: "Como é feito o orçamento?",
    r: "Por metro quadrado, depois da visita técnica, que não tem custo. Na visita, o técnico identifica a causa, mede a área e avalia a superfície. A proposta traz o sistema indicado para cada área, o quantitativo, o prazo de execução e a garantia por escrito. A resposta ao primeiro contato sai em até 1 dia útil.",
  },
  sistema: {
    p: "Qual sistema de impermeabilização vocês usam?",
    r: "Depende da superfície e do uso da área. A Verus executa seis sistemas: manta asfáltica, poliureia, cimentício, poliuretano, membrana acrílica e hidrofugante. Não existe produto único que sirva para tudo: o sistema é escolhido no diagnóstico, descrito no memorial e aplicado camada por camada, com cada etapa conferida antes da próxima.",
  },
  construtora: {
    p: "Atendem construtora e condomínio com cronograma?",
    r: "Sim. A Verus trabalha com construtoras, incorporadoras e condomínios com cronograma alinhado à obra. Cada área recebe sistema especificado em memorial descritivo, é testada antes de liberar a próxima etapa e entra no relatório fotográfico. O cliente acompanha etapas, fotos, propostas e garantia pelo portal online.",
  },
  residencial: {
    p: "Atendem casa e apartamento?",
    r: "Sim. Além de construtoras e condomínios, a Verus atende casa e apartamento com infiltração em laje, piscina, varanda, banheiro ou parede. A visita técnica não tem custo: o técnico identifica a causa, mede a área e depois envia o orçamento por metro quadrado, com o sistema indicado e a garantia por escrito.",
  },
  cidades: {
    p: "Quais cidades a Verus atende?",
    r: `A ${EMPRESA.nome} atende ${EMPRESA.cidade} e mais ${OUTRAS_CIDADES.length} cidades de Alagoas: ${OUTRAS_CIDADES.slice(0, -1).join(", ")} e ${OUTRAS_CIDADES.at(-1)}.`,
    d: `O atendimento começa pelo WhatsApp ${EMPRESA.telefoneFormatado}, com resposta em até 1 dia útil.`,
  },
  oQueELaje: {
    p: "O que é impermeabilização de laje?",
    r: "É a aplicação de uma barreira contínua sobre a laje, depois de limpar, regularizar e conferir o caimento da superfície, para que a água da chuva não atravesse o concreto e chegue ao ambiente de baixo. Em laje exposta, a Verus usa manta asfáltica, poliureia ou membrana acrílica, conforme tráfego, exposição ao sol e movimentação térmica.",
  },
  oQueEFundacao: {
    p: "O que é impermeabilização de fundação e baldrame?",
    r: "É a proteção das partes da obra em contato com o solo, como baldrames, cortinas de contenção e paredes de subsolo, contra a umidade que sobe do terreno e a água que pressiona a parede pelo lado oposto ao da aplicação (pressão negativa). Sem ela, aparecem mofo, pintura estufada e salitre no pé das paredes.",
    d: "Em obra nova, o baldrame é impermeabilizado antes de subir a alvenaria. Em subsolo e garagem já prontos, a Verus usa sistema cimentício, que resiste à pressão da água.",
  },
  hidrofugante: {
    p: "O que é hidrofugante e quando usar na fachada?",
    r: "Hidrofugante é um produto incolor aplicado em fachada, muro ou tijolo aparente que faz a superfície repelir a água da chuva sem mudar a aparência. É indicado quando a chuva de vento molha a parede e a umidade aparece do lado de dentro. Fissuras e juntas de dilatação precisam ser seladas antes da aplicação.",
  },
  aguaPotavel: {
    p: "Qual impermeabilizante usar em caixa d'água de água potável?",
    r: "Um sistema próprio para contato com água de consumo, que não altere a qualidade da água. A referência é a ABNT NBR 12170, que trata da potabilidade da água em sistemas de impermeabilização. No escopo padrão da Verus, caixa d'água, cisterna e reservatório recebem argamassa polimérica flexível, conforme as normas ABNT NBR 9575 e 12170.",
    d: "A aplicação vai do fundo até a altura cheia da lâmina d'água, e a caixa só volta a uso depois da cura e do teste de estanqueidade.",
  },
  piscinaPerdendoAgua: {
    p: "Piscina perdendo água: o que fazer?",
    r: "Primeiro, confirme se é vazamento ou evaporação com o teste do balde: coloque um balde com água no degrau da piscina, marque o nível dentro do balde e o nível da piscina e compare depois de 24 horas, sem usar a piscina. Se a piscina baixou bem mais que o balde, há vazamento.",
    d: "O vazamento pode estar na impermeabilização ou na tubulação. Na visita técnica, sem custo, a Verus identifica a origem antes de propor o reparo.",
  },
  piscinaManta: {
    p: "Dá para impermeabilizar piscina com manta asfáltica?",
    r: "Dá. Manta asfáltica, manta líquida de poliuretano e poliureia também são usadas em piscina, conforme a estrutura e o revestimento. O escopo padrão da Verus para piscina de alvenaria ou concreto é argamassa polimérica flexível em três demãos cruzadas até a altura da lâmina d'água. O sistema é definido na visita técnica, depois de avaliar a piscina.",
  },
  alturaBanheiro: {
    p: "Até que altura impermeabilizar o banheiro?",
    r: "No padrão da Verus, baseado nas normas ABNT NBR 9575 e 9574, a impermeabilização sobe 30 cm nas paredes da área molhada e 1,50 m no box do chuveiro, com tela de reforço em cantos e ralos. Varanda e sacada também levam rodapé de 30 cm. O teste de estanqueidade é feito antes de assentar o revestimento.",
  },
  oQueEManta: {
    p: "O que é manta asfáltica?",
    r: "Manta asfáltica é uma lâmina pré-fabricada de asfalto modificado com um estruturante, geralmente poliéster, vendida em rolos. Na aplicação, a laje recebe primer e a manta é soldada com maçarico, com as emendas sobrepostas, formando uma barreira contínua contra a água. É indicada para lajes, coberturas e terraços com grande movimentação térmica.",
  },
  mantaProtecao: {
    p: "Manta asfáltica precisa de proteção mecânica?",
    r: "Na maioria dos casos, sim. A manta comum recebe proteção mecânica, uma camada de argamassa por cima, para não ressecar no sol nem rasgar com o tráfego. Mantas aluminizadas ou com acabamento mineral são feitas para ficar expostas em coberturas sem tráfego. Na visita técnica, a Verus indica o tipo de manta conforme o uso da laje.",
  },
} satisfies Record<string, Pergunta>;

/** FAQ da página inicial: as perguntas mais buscadas primeiro, depois as de obra. */
export const FAQ_HOME: Pergunta[] = [
  PERGUNTAS.oQueE,
  PERGUNTAS.custoLaje,
  PERGUNTAS.custoReservatorio,
  PERGUNTAS.mantaOuLiquida,
  PERGUNTAS.duracao,
  PERGUNTAS.infiltracaoLaje,
  PERGUNTAS.infiltracaoParede,
  PERGUNTAS.quebrarPiso,
  PERGUNTAS.bemFeita,
  PERGUNTAS.garantia,
  PERGUNTAS.construtora,
  PERGUNTAS.residencial,
  PERGUNTAS.cidades,
];

/** Texto completo da resposta (direta + detalhe), igual ao que aparece na página. */
export const respostaCompleta = (q: Pergunta) => (q.d ? `${q.r} ${q.d}` : q.r);

/** JSON-LD FAQPage gerado da mesma lista exibida na página. */
export const faqPageJsonLd = (itens: Pergunta[], url: string) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  url,
  inLanguage: "pt-BR",
  dateModified: REVISADO_EM,
  mainEntity: itens.map((q) => ({
    "@type": "Question",
    name: q.p,
    acceptedAnswer: { "@type": "Answer", text: respostaCompleta(q) },
  })),
});
