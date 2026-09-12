/** Dados públicos da Verus usados na landing, no JSON-LD e nos links de WhatsApp. */
export const EMPRESA = {
  nome: "Verus Impermeabilizações",
  razao: "Verus Impermeabilização LTDA",
  cnpj: "66.042.580/0001-98",
  slogan: "Impermeabilização com garantia em Maceió e região",
  telefone: "5582991669449",
  telefoneFormatado: "(82) 99166-9449",
  email: "verusimpermeabilizacoes@gmail.com",
  instagram: "https://www.instagram.com/verusimpermeabilizacoes",
  cidade: "Maceió",
  uf: "AL",
  horario: "Seg–Sex 08:00–17:00 · Sáb 08:00–12:00",
  site: process.env.NEXT_PUBLIC_SITE_URL ?? "https://verusimpermeabilizacoes.com.br",
};

/** Mesmas 20 cidades do Perfil da Empresa no Google. */
export const AREAS = [
  "Maceió", "Rio Largo", "Marechal Deodoro", "Paripueira", "Satuba", "Barra de São Miguel",
  "Pilar", "Coqueiro Seco", "Santa Luzia do Norte", "Messias", "Murici", "Barra de Santo Antônio",
  "São Luís do Quitunde", "São Miguel dos Campos", "Coruripe", "Penedo", "Maragogi",
  "União dos Palmares", "Palmeira dos Índios", "Arapiraca",
];

export const SERVICOS = [
  {
    titulo: "Lajes e coberturas",
    desc: "Infiltração no teto, mancha, bolha na pintura. Manta asfáltica, poliureia ou membrana acrílica conforme a laje.",
    tag: "mais pedido",
  },
  {
    titulo: "Piscinas e reservatórios",
    desc: "Piscina perdendo água, caixa d'água ou cisterna com vazamento. Sistema cimentício ou poliuretano com teste de estanqueidade.",
  },
  {
    titulo: "Subsolos e garagens",
    desc: "Umidade que sobe pela parede, junta de dilatação vazando, cortina de contenção molhada.",
  },
  {
    titulo: "Banheiros, varandas e sacadas",
    desc: "Área molhada impermeabilizada antes do piso — o jeito certo, sem quebrar depois.",
  },
  {
    titulo: "Fachadas e muros",
    desc: "Chuva de vento entrando pela parede. Hidrofugante, selagem de fissura e pintura impermeabilizante.",
  },
  {
    titulo: "Condomínios e construtoras",
    desc: "Obra com cronograma, ART e laudo técnico. Atendemos síndicos, engenheiros e reformas prediais.",
  },
];

export const SISTEMAS = [
  ["Manta asfáltica", "Lajes, coberturas e áreas de grande movimentação térmica."],
  ["Poliureia", "Aplicação a quente, cura em segundos, sem emenda. Coberturas e reservatórios."],
  ["Cimentício", "Piscinas, caixas d'água, subsolos. Resiste à pressão da água."],
  ["Poliuretano", "Áreas com fissura e movimento. Elástico e resistente a UV."],
  ["Membrana acrílica", "Telhados e lajes com trânsito leve. Reflete calor."],
  ["Hidrofugante", "Fachadas e muros. Repele água sem mudar a aparência."],
] as const;

export const ETAPAS = [
  ["Você chama", "WhatsApp ou formulário. Respondemos em até 1 dia útil."],
  ["Visita técnica", "Vamos ao local, achamos a causa e medimos a área."],
  ["Orçamento por m²", "Proposta com sistema indicado, prazo e garantia por escrito."],
  ["Execução e teste", "Preparação, primer, aplicação e teste de estanqueidade antes de liberar."],
  ["Garantia e pós-venda", "Termo de garantia em PDF e acompanhamento depois da obra."],
] as const;

export const FAQ = [
  {
    p: "Quanto custa impermeabilizar uma laje em Maceió?",
    r: "Depende do sistema e da área. O orçamento é por m² e sai depois da visita técnica, sem custo, com o sistema certo pro seu caso. Você não paga pela visita.",
  },
  {
    p: "Como sei se é infiltração ou só umidade?",
    r: "Mancha que cresce depois da chuva, bolha na tinta, cheiro de mofo e goteira são sinais de infiltração. Na visita a gente identifica a origem antes de propor qualquer serviço.",
  },
  {
    p: "Vocês dão garantia?",
    r: "Sim. A garantia vai por escrito no contrato e você recebe o termo de garantia em PDF ao final da obra.",
  },
  {
    p: "Precisa quebrar o piso?",
    r: "Nem sempre. Em laje e cobertura a aplicação costuma ser sobre a superfície preparada. Em área molhada já pronta, avaliamos o menor caminho na visita.",
  },
  {
    p: "Atendem condomínio e construtora?",
    r: "Sim. Trabalhamos com síndicos, engenheiros e construtoras com cronograma, ART e laudo técnico.",
  },
  {
    p: "Quais cidades vocês atendem?",
    r: `Maceió e região: ${AREAS.slice(0, 8).join(", ")} e mais ${AREAS.length - 8} cidades de Alagoas.`,
  },
];

/* ── Landing para construção civil (construtora primeiro) ─────────────────── */

export const PUBLICOS = [
  "Construtoras e incorporadoras",
  "Condomínios e síndicos",
  "Engenheiros e arquitetos",
  "Indústria e comércio",
  "Reforma residencial",
] as const;

export const APLICACOES = [
  {
    titulo: "Lajes e coberturas",
    desc: "Terraços, coberturas técnicas e lajes expostas. Manta asfáltica, poliureia ou membrana conforme tráfego, exposição e movimentação térmica.",
    tag: "mais executado",
  },
  {
    titulo: "Fundações e subsolos",
    desc: "Baldrames, cortinas de contenção e garagens enterradas. Barreira contra umidade ascendente e pressão negativa.",
  },
  {
    titulo: "Reservatórios e piscinas",
    desc: "Contato permanente com água e variação de carga. Sistema cimentício ou poliuretano, liberado só depois do teste de estanqueidade.",
  },
  {
    titulo: "Banheiros, varandas e sacadas",
    desc: "Área molhada impermeabilizada antes do piso, com detalhe de ralo, soleira e rodapé. Sem quebrar depois.",
  },
  {
    titulo: "Fachadas e juntas",
    desc: "Juntas de dilatação, fissuras e hidrofugação de fachada contra chuva de vento.",
  },
  {
    titulo: "Correção de patologias",
    desc: "Infiltração em obra já entregue: diagnóstico da causa, abertura mínima e reparo com garantia por escrito.",
  },
] as const;

export const CAMADAS = [
  ["Preparação", "Superfície limpa, regularizada e com caimento conferido. Sem isso nenhum sistema dura."],
  ["Primer", "Ponte de aderência específica para o substrato e para o sistema escolhido."],
  ["Membrana", "Barreira contínua — manta, poliureia, cimentício ou poliuretano, conforme o memorial."],
  ["Proteção", "Proteção mecânica e teste de estanqueidade antes de liberar para a próxima etapa da obra."],
] as const;

export const METODO = [
  ["Diagnóstico técnico", "Visita ao local, identificação da causa e medição da área. Sem custo."],
  ["Especificação do sistema", "Memorial com sistema indicado, quantitativo por m², prazo e garantia por escrito."],
  ["Execução controlada", "Equipe própria, etapa a etapa, com registro fotográfico e cronograma alinhado à obra."],
  ["Entrega com garantia", "Teste de estanqueidade, laudo, termo de garantia em PDF e acompanhamento pós-obra."],
] as const;

export const ENTREGAVEIS = [
  "Memorial descritivo do sistema",
  "Orçamento por m² com prazo",
  "ART quando exigida",
  "Relatório fotográfico da execução",
  "Teste de estanqueidade documentado",
  "Termo de garantia em PDF",
] as const;

export const FAQ_OBRA = [
  {
    p: "Atendem construtora com cronograma e ART?",
    r: "Sim. Trabalhamos com construtoras, incorporadoras e condomínios com cronograma alinhado à obra, memorial descritivo, ART quando exigida e laudo ao final.",
  },
  {
    p: "Como é feito o orçamento?",
    r: "Por m², depois da visita técnica. A proposta traz o sistema indicado para cada área, quantitativo, prazo de execução e garantia por escrito. A visita não tem custo.",
  },
  {
    p: "Qual sistema vocês usam?",
    r: "O que o substrato pede: manta asfáltica, poliureia, cimentício, poliuretano, membrana acrílica ou hidrofugante. Não existe produto único — existe diagnóstico, sistema adequado e aplicação bem feita.",
  },
  {
    p: "Como sei que ficou estanque?",
    r: "Toda área é testada antes de ser liberada: lâmina d'água em laje e área molhada, enchimento em reservatório e piscina. O teste vai documentado no relatório.",
  },
  {
    p: "Vocês dão garantia?",
    r: "Sim. A garantia vai por escrito no contrato e você recebe o termo de garantia em PDF ao final da obra, com acompanhamento pós-entrega.",
  },
  {
    p: "Atendem casa e apartamento?",
    r: "Sim. Infiltração em laje, piscina, varanda ou parede de imóvel residencial também é atendida com visita técnica sem custo.",
  },
  {
    p: "Quais cidades vocês atendem?",
    r: `Maceió e região: ${AREAS.slice(0, 8).join(", ")} e mais ${AREAS.length - 8} cidades de Alagoas.`,
  },
];
