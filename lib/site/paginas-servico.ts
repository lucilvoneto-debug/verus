/**
 * Páginas por serviço do site (/impermeabilizacao/<slug>).
 * Todo texto aqui reaproveita o que a landing já afirma (lib/site/empresa.ts e
 * lib/site/perguntas.ts) ou o escopo padrão das propostas (lib/impermeabilizacao/escopos.ts):
 * não acrescentar promessa nova (preço, garantia em anos, prazo) sem o dono confirmar.
 * O escopo fala em "garantia 5 anos" e "material fornecido pela obra": fora do site por ora.
 */
import { APLICACOES, SERVICOS, SISTEMAS } from "@/lib/site/empresa";
import { PERGUNTAS, type Pergunta } from "@/lib/site/perguntas";

type Etapa = readonly [titulo: string, descricao: string];

export type PaginaServico = {
  slug: string;
  /** Nome curto (migalha e cards). Se for igual a um título de APLICACOES, liga ao card da landing. */
  aplicacao: string;
  nome: string;
  titulo: string;
  descricao: string;
  /** Frase "o que é" no topo da página (resposta curta para buscador e IA). */
  oQueE: string;
  intro: string;
  sinais: string;
  sistemas: string[];
  imagem: { src: string; alt: string; largura: number; altura: number };
  faq: Pergunta[];
  mensagem: string;
  /** Etapas do escopo padrão; sem isso a página mostra as camadas gerais (CAMADAS). */
  processo?: { titulo: string; etapas: readonly Etapa[] };
  /** 2 a 3 serviços relacionados (slugs), linkados no fim da página. */
  relacionados: string[];
};

const descAplicacao = (titulo: string) => APLICACOES.find((a) => a.titulo === titulo)?.desc ?? "";
const descServico = (titulo: string) => SERVICOS.find((s) => s.titulo === titulo)?.desc ?? "";

const FOTO_PISCINA = { src: "/site/piscina-manta.jpg", alt: "Manta asfáltica aplicada em piscina", largura: 1066, altura: 711 };
const FOTO_VISITA = { src: "/site/visita-tecnica.jpg", alt: "Técnico da Verus em visita de diagnóstico", largura: 1290, altura: 2293 };
const FOTO_OBRA = { src: "/site/obra-material.jpg", alt: "Material de impermeabilização na obra", largura: 1600, altura: 2133 };

export const PAGINAS_SERVICO: PaginaServico[] = [
  {
    slug: "lajes-e-coberturas",
    aplicacao: "Lajes e coberturas",
    nome: "Impermeabilização de lajes e coberturas",
    titulo: "Impermeabilização de laje e cobertura em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de lajes, terraços e coberturas em Maceió e Alagoas: manta asfáltica, poliureia ou membrana acrílica, com teste de estanqueidade e garantia por escrito.",
    oQueE:
      "Impermeabilizar a laje é aplicar uma barreira contínua sobre a superfície para que a água da chuva não atravesse o concreto e chegue ao ambiente de baixo.",
    intro: descAplicacao("Lajes e coberturas"),
    sinais: descServico("Lajes e coberturas"),
    sistemas: ["Manta asfáltica", "Poliureia", "Membrana acrílica"],
    imagem: FOTO_OBRA,
    faq: [
      PERGUNTAS.oQueELaje,
      PERGUNTAS.custoLaje,
      PERGUNTAS.mantaOuLiquida,
      PERGUNTAS.duracao,
      PERGUNTAS.infiltracaoLaje,
      PERGUNTAS.quebrarPiso,
      PERGUNTAS.bemFeita,
      PERGUNTAS.garantia,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de laje/cobertura.",
    relacionados: ["manta-asfaltica", "correcao-de-infiltracao", "fachadas-e-juntas"],
  },
  {
    slug: "manta-asfaltica",
    aplicacao: "Manta asfáltica",
    nome: "Impermeabilização com manta asfáltica",
    titulo: "Impermeabilização com manta asfáltica em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de laje, cobertura e terraço com manta asfáltica em Maceió e Alagoas: primer, manta soldada com maçarico, reforço em ralos e teste com lâmina d'água por 72 horas.",
    oQueE:
      "Impermeabilização com manta asfáltica é a aplicação de mantas de asfalto modificado, soldadas com maçarico, formando uma barreira contínua sobre a laje.",
    intro: "Lajes de cobertura, terraços e áreas expostas com grande movimentação térmica.",
    sinais: "Mancha no teto depois da chuva, manta antiga ressecada, descolando ou com bolhas, emendas abertas e água parada sobre a laje.",
    sistemas: ["Manta asfáltica"],
    imagem: FOTO_PISCINA,
    processo: {
      titulo: "Como é feita a impermeabilização com manta asfáltica?",
      etapas: [
        ["Preparação", "Limpeza da laje e conferência do caimento para os ralos."],
        ["Primer", "Primer asfáltico para a manta aderir ao concreto."],
        ["Manta", "Manta soldada com maçarico, emendas sobrepostas em no mínimo 10 cm e subida de 30 cm nas paredes e rodapés."],
        ["Reforço e teste", "Reforço em ralos, cantos e tubulações e teste de estanqueidade com lâmina d'água por 72 horas."],
      ],
    },
    faq: [
      PERGUNTAS.oQueEManta,
      PERGUNTAS.mantaProtecao,
      PERGUNTAS.mantaOuLiquida,
      PERGUNTAS.custoLaje,
      PERGUNTAS.duracao,
      PERGUNTAS.garantia,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização com manta asfáltica.",
    relacionados: ["lajes-e-coberturas", "piscina", "correcao-de-infiltracao"],
  },
  {
    slug: "fundacoes-e-subsolos",
    aplicacao: "Fundações e subsolos",
    nome: "Impermeabilização de fundações e subsolos",
    titulo: "Impermeabilização de fundação e subsolo em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de baldrames, cortinas de contenção e garagens enterradas em Maceió e Alagoas, contra umidade ascendente e pressão negativa.",
    oQueE:
      "Impermeabilizar fundação e subsolo é proteger baldrames, cortinas de contenção e paredes enterradas da umidade e da água que vêm do solo.",
    intro: descAplicacao("Fundações e subsolos"),
    sinais: descServico("Subsolos e garagens"),
    sistemas: ["Cimentício"],
    imagem: FOTO_OBRA,
    processo: {
      titulo: "Como é feita a impermeabilização de subsolo e contenção?",
      etapas: [
        ["Preparação", "Limpeza e saturação da superfície com água."],
        ["Aplicação", "Impermeabilizante cimentício rígido ou cristalizante em duas a três demãos."],
        ["Detalhes", "Tratamento das juntas e das passagens de tubulação."],
        ["Pressão negativa", "Sistema adequado para a água que empurra do lado oposto, como em subsolo e contenção."],
      ],
    },
    faq: [
      PERGUNTAS.oQueEFundacao,
      PERGUNTAS.infiltracaoParede,
      PERGUNTAS.orcamento,
      PERGUNTAS.sistema,
      PERGUNTAS.construtora,
      PERGUNTAS.garantia,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de fundação/subsolo.",
    relacionados: ["correcao-de-infiltracao", "fachadas-e-juntas", "reservatorios-e-piscinas"],
  },
  {
    slug: "reservatorios-e-piscinas",
    aplicacao: "Reservatórios e piscinas",
    nome: "Impermeabilização de reservatórios e piscinas",
    titulo: "Impermeabilização de piscina e caixa d'água em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de piscinas, caixas d'água e cisternas em Maceió e Alagoas, com sistema cimentício ou poliuretano e liberação só depois do teste de estanqueidade.",
    oQueE:
      "Impermeabilizar piscina e caixa d'água é revestir a estrutura por dentro com um sistema que suporta contato permanente com água, sem vazamento.",
    intro: descAplicacao("Reservatórios e piscinas"),
    sinais: descServico("Piscinas e reservatórios"),
    sistemas: ["Cimentício", "Poliuretano", "Poliureia"],
    imagem: FOTO_PISCINA,
    faq: [
      PERGUNTAS.caixaDagua,
      PERGUNTAS.piscina,
      PERGUNTAS.custoReservatorio,
      PERGUNTAS.bemFeita,
      PERGUNTAS.garantia,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de piscina/reservatório.",
    relacionados: ["caixa-d-agua", "piscina", "fundacoes-e-subsolos"],
  },
  {
    slug: "caixa-d-agua",
    aplicacao: "Caixa d'água",
    nome: "Impermeabilização de caixa d'água",
    titulo: "Impermeabilização de caixa d'água e cisterna em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de caixa d'água, cisterna e reservatório de concreto ou alvenaria em Maceió e Alagoas, com argamassa polimérica flexível, cura úmida e teste de estanqueidade antes de liberar.",
    oQueE:
      "Impermeabilizar caixa d'água é revestir o fundo e as paredes por dentro com um sistema próprio para água potável, para que o reservatório não vaze.",
    intro: "Caixas d'água, cisternas e reservatórios de concreto ou alvenaria, em casa, condomínio ou obra.",
    sinais: "Vazamento na caixa d'água ou na cisterna, umidade ou mancha na laje e nas paredes em volta e reboco soltando por dentro do reservatório.",
    sistemas: ["Cimentício", "Poliuretano"],
    imagem: FOTO_OBRA,
    processo: {
      titulo: "Como é feita a impermeabilização da caixa d'água?",
      etapas: [
        ["Preparação", "Caixa esvaziada e limpa, partes soltas removidas e superfície saturada com água."],
        ["Aplicação", "Argamassa polimérica flexível em três demãos cruzadas no fundo e nas paredes, na altura cheia da lâmina d'água."],
        ["Reforço", "Tela de reforço nos cantos e nos encontros entre piso e parede."],
        ["Cura e teste", "Cura úmida e teste de estanqueidade com a caixa cheia antes de liberar."],
      ],
    },
    faq: [
      PERGUNTAS.aguaPotavel,
      PERGUNTAS.custoReservatorio,
      PERGUNTAS.bemFeita,
      PERGUNTAS.construtora,
      PERGUNTAS.garantia,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de caixa d'água/cisterna.",
    relacionados: ["reservatorios-e-piscinas", "piscina", "lajes-e-coberturas"],
  },
  {
    slug: "piscina",
    aplicacao: "Piscina",
    nome: "Impermeabilização de piscina",
    titulo: "Impermeabilização de piscina em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de piscina de alvenaria ou concreto em Maceió e Alagoas: argamassa polimérica flexível em três demãos, reforço em cantos e ralos de fundo e teste de estanqueidade antes do acabamento.",
    oQueE:
      "Impermeabilizar piscina é aplicar, sob o revestimento, uma camada contínua que segura a água no fundo e nas paredes, sem vazar para o terreno.",
    intro: "Piscinas e espelhos d'água de alvenaria ou concreto, em obra nova ou reforma.",
    sinais: "Nível baixando mais do que a evaporação explica, terreno úmido em volta, pastilha ou azulejo soltando e trincas no fundo ou nas paredes.",
    sistemas: ["Cimentício", "Poliuretano", "Poliureia"],
    imagem: FOTO_PISCINA,
    processo: {
      titulo: "Como é feita a impermeabilização da piscina?",
      etapas: [
        ["Preparação", "Piscina vazia, superfície preparada e caimentos conferidos."],
        ["Aplicação", "Argamassa polimérica flexível em três demãos cruzadas no fundo e nas paredes, até a altura da lâmina d'água."],
        ["Reforço", "Tela de reforço em cantos, ralos de fundo e tubulações."],
        ["Teste", "Teste de estanqueidade com a piscina cheia, antes do acabamento."],
      ],
    },
    faq: [
      PERGUNTAS.piscinaPerdendoAgua,
      PERGUNTAS.piscinaManta,
      PERGUNTAS.custoReservatorio,
      PERGUNTAS.residencial,
      PERGUNTAS.garantia,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de piscina.",
    relacionados: ["reservatorios-e-piscinas", "caixa-d-agua", "manta-asfaltica"],
  },
  {
    slug: "banheiros-varandas-e-sacadas",
    aplicacao: "Banheiros, varandas e sacadas",
    nome: "Impermeabilização de banheiros, varandas e sacadas",
    titulo: "Impermeabilização de banheiro, varanda e sacada em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de áreas molhadas antes do piso em Maceió e Alagoas, com detalhe de ralo, soleira e rodapé e teste de estanqueidade antes de liberar.",
    oQueE:
      "Impermeabilizar banheiro, varanda e sacada é criar uma barreira sob o piso para que a água do uso diário não passe para a laje, a parede ou o vizinho de baixo.",
    intro: descAplicacao("Banheiros, varandas e sacadas"),
    sinais: descServico("Banheiros, varandas e sacadas"),
    sistemas: [],
    imagem: FOTO_VISITA,
    processo: {
      titulo: "Como é feita a impermeabilização de banheiro, varanda e sacada?",
      etapas: [
        ["Preparação", "Limpeza da base e conferência do caimento para o ralo."],
        ["Membrana", "Membrana líquida de poliuretano ou acrílica em três demãos, com tela de reforço em cantos e ralos."],
        ["Subida nas paredes", "30 cm nas paredes da área molhada e da varanda e 1,50 m no box do chuveiro."],
        ["Teste", "Teste de estanqueidade antes de assentar o revestimento."],
      ],
    },
    faq: [
      PERGUNTAS.alturaBanheiro,
      PERGUNTAS.banheiro,
      PERGUNTAS.quebrarPiso,
      PERGUNTAS.bemFeita,
      PERGUNTAS.orcamento,
      PERGUNTAS.residencial,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de banheiro/varanda.",
    relacionados: ["correcao-de-infiltracao", "lajes-e-coberturas", "piscina"],
  },
  {
    slug: "fachadas-e-juntas",
    aplicacao: "Fachadas e juntas",
    nome: "Impermeabilização e hidrofugação de fachadas",
    titulo: "Hidrofugação e impermeabilização de fachada em Maceió | Verus",
    descricao:
      "Tratamento de juntas de dilatação, fissuras e hidrofugação de fachada contra chuva de vento em Maceió e Alagoas.",
    oQueE:
      "Impermeabilizar fachada é tratar fissuras, juntas de dilatação e a superfície externa para que a chuva de vento não entre pela parede.",
    intro: descAplicacao("Fachadas e juntas"),
    sinais: descServico("Fachadas e muros"),
    sistemas: ["Hidrofugante", "Poliuretano"],
    imagem: FOTO_OBRA,
    faq: [
      PERGUNTAS.infiltracaoParede,
      PERGUNTAS.hidrofugante,
      PERGUNTAS.orcamento,
      PERGUNTAS.sistema,
      PERGUNTAS.cidades,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de fachada/junta.",
    relacionados: ["correcao-de-infiltracao", "fundacoes-e-subsolos", "lajes-e-coberturas"],
  },
  {
    slug: "correcao-de-infiltracao",
    aplicacao: "Correção de patologias",
    nome: "Correção de infiltração",
    titulo: "Correção de infiltração em Maceió | Verus Impermeabilizações",
    descricao:
      "Infiltração em obra já entregue em Maceió e Alagoas: diagnóstico da causa na visita técnica, abertura mínima e reparo com garantia por escrito.",
    oQueE:
      "Corrigir infiltração é descobrir por onde a água entra e refazer a impermeabilização no ponto que falhou.",
    intro: descAplicacao("Correção de patologias"),
    sinais: "Mancha que cresce depois da chuva, bolha na tinta, cheiro de mofo, reboco esfarelando ou goteira em imóvel já entregue.",
    sistemas: [],
    imagem: FOTO_VISITA,
    faq: [
      PERGUNTAS.infiltracaoOuUmidade,
      PERGUNTAS.infiltracaoLaje,
      PERGUNTAS.infiltracaoParede,
      PERGUNTAS.quebrarPiso,
      PERGUNTAS.residencial,
      PERGUNTAS.garantia,
    ],
    mensagem: "Olá! Tenho infiltração e quero agendar uma visita técnica.",
    relacionados: ["lajes-e-coberturas", "banheiros-varandas-e-sacadas", "fachadas-e-juntas"],
  },
];

// Confere no build que todo relacionado existe e não aponta para a própria página.
for (const p of PAGINAS_SERVICO) {
  for (const r of p.relacionados) {
    if (r === p.slug || !PAGINAS_SERVICO.some((o) => o.slug === r)) {
      throw new Error(`Serviço relacionado inválido em ${p.slug}: ${r}`);
    }
  }
}

export const paginaPorSlug = (slug: string) => PAGINAS_SERVICO.find((p) => p.slug === slug);
export const paginaPorAplicacao = (titulo: string) => PAGINAS_SERVICO.find((p) => p.aplicacao === titulo);
export const descricaoSistema = (nome: string) => SISTEMAS.find(([n]) => n === nome)?.[1] ?? "";
