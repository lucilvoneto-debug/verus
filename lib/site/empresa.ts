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
  site: process.env.NEXT_PUBLIC_SITE_URL ?? "https://verus-neon.vercel.app",
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
