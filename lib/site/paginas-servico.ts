/**
 * Páginas por serviço do site (/impermeabilizacao/<slug>).
 * Todo texto aqui reaproveita o que a landing já afirma (lib/site/empresa.ts):
 * não acrescentar promessa nova (prazo, garantia em anos, norma) sem o dono confirmar.
 */
import { APLICACOES, FAQ, FAQ_OBRA, SERVICOS, SISTEMAS } from "@/lib/site/empresa";

type Pergunta = { p: string; r: string };

export type PaginaServico = {
  slug: string;
  /** Título do card em APLICACOES — liga a página ao card da landing. */
  aplicacao: (typeof APLICACOES)[number]["titulo"];
  nome: string;
  titulo: string;
  descricao: string;
  intro: string;
  sinais: string;
  sistemas: string[];
  imagem: { src: string; alt: string; largura: number; altura: number };
  faq: Pergunta[];
  mensagem: string;
};

const faqPor = (pergunta: string): Pergunta => {
  const achada = [...FAQ_OBRA, ...FAQ].find((f) => f.p === pergunta);
  if (!achada) throw new Error(`Pergunta não encontrada em empresa.ts: ${pergunta}`);
  return achada;
};

const descAplicacao = (titulo: string) => APLICACOES.find((a) => a.titulo === titulo)?.desc ?? "";
const descServico = (titulo: string) => SERVICOS.find((s) => s.titulo === titulo)?.desc ?? "";

const FOTO_PISCINA = { src: "/site/piscina-manta.jpg", alt: "Manta asfáltica aplicada em piscina", largura: 1066, altura: 711 };
const FOTO_VISITA = { src: "/site/visita-tecnica.jpg", alt: "Técnico da Verus em visita de diagnóstico", largura: 1290, altura: 2293 };
const FOTO_OBRA = { src: "/site/obra-material.jpg", alt: "Material de impermeabilização na obra", largura: 1600, altura: 2133 };

const ORCAMENTO = "Como é feito o orçamento?";
const ESTANQUE = "Como sei que ficou estanque?";
const GARANTIA = "Vocês dão garantia?";
const CIDADES = "Quais cidades vocês atendem?";

export const PAGINAS_SERVICO: PaginaServico[] = [
  {
    slug: "lajes-e-coberturas",
    aplicacao: "Lajes e coberturas",
    nome: "Impermeabilização de lajes e coberturas",
    titulo: "Impermeabilização de laje e cobertura em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de lajes, terraços e coberturas em Maceió e Alagoas: manta asfáltica, poliureia ou membrana acrílica, com teste de estanqueidade e garantia por escrito.",
    intro: descAplicacao("Lajes e coberturas"),
    sinais: descServico("Lajes e coberturas"),
    sistemas: ["Manta asfáltica", "Poliureia", "Membrana acrílica"],
    imagem: FOTO_OBRA,
    faq: [faqPor("Quanto custa impermeabilizar uma laje em Maceió?"), faqPor("Precisa quebrar o piso?"), faqPor(ESTANQUE), faqPor(GARANTIA)],
    mensagem: "Olá! Quero orçamento de impermeabilização de laje/cobertura.",
  },
  {
    slug: "fundacoes-e-subsolos",
    aplicacao: "Fundações e subsolos",
    nome: "Impermeabilização de fundações e subsolos",
    titulo: "Impermeabilização de fundação e subsolo em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de baldrames, cortinas de contenção e garagens enterradas em Maceió e Alagoas, contra umidade ascendente e pressão negativa.",
    intro: descAplicacao("Fundações e subsolos"),
    sinais: descServico("Subsolos e garagens"),
    sistemas: ["Cimentício"],
    imagem: FOTO_OBRA,
    faq: [faqPor(ORCAMENTO), faqPor("Qual sistema vocês usam?"), faqPor(GARANTIA)],
    mensagem: "Olá! Quero orçamento de impermeabilização de fundação/subsolo.",
  },
  {
    slug: "reservatorios-e-piscinas",
    aplicacao: "Reservatórios e piscinas",
    nome: "Impermeabilização de reservatórios e piscinas",
    titulo: "Impermeabilização de piscina e caixa d'água em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de piscinas, caixas d'água e cisternas em Maceió e Alagoas, com sistema cimentício ou poliuretano e liberação só depois do teste de estanqueidade.",
    intro: descAplicacao("Reservatórios e piscinas"),
    sinais: descServico("Piscinas e reservatórios"),
    sistemas: ["Cimentício", "Poliuretano", "Poliureia"],
    imagem: FOTO_PISCINA,
    faq: [faqPor(ESTANQUE), faqPor(ORCAMENTO), faqPor(GARANTIA)],
    mensagem: "Olá! Quero orçamento de impermeabilização de piscina/reservatório.",
  },
  {
    slug: "banheiros-varandas-e-sacadas",
    aplicacao: "Banheiros, varandas e sacadas",
    nome: "Impermeabilização de banheiros, varandas e sacadas",
    titulo: "Impermeabilização de banheiro, varanda e sacada em Maceió | Verus Impermeabilizações",
    descricao:
      "Impermeabilização de áreas molhadas antes do piso em Maceió e Alagoas, com detalhe de ralo, soleira e rodapé e teste de estanqueidade antes de liberar.",
    intro: descAplicacao("Banheiros, varandas e sacadas"),
    sinais: descServico("Banheiros, varandas e sacadas"),
    sistemas: [],
    imagem: FOTO_VISITA,
    faq: [faqPor("Precisa quebrar o piso?"), faqPor(ESTANQUE), faqPor(ORCAMENTO)],
    mensagem: "Olá! Quero orçamento de impermeabilização de banheiro/varanda.",
  },
  {
    slug: "fachadas-e-juntas",
    aplicacao: "Fachadas e juntas",
    nome: "Impermeabilização de fachadas e juntas",
    titulo: "Impermeabilização de fachada e junta de dilatação em Maceió | Verus Impermeabilizações",
    descricao:
      "Tratamento de juntas de dilatação, fissuras e hidrofugação de fachada contra chuva de vento em Maceió e Alagoas.",
    intro: descAplicacao("Fachadas e juntas"),
    sinais: descServico("Fachadas e muros"),
    sistemas: ["Hidrofugante", "Poliuretano"],
    imagem: FOTO_OBRA,
    faq: [faqPor(ORCAMENTO), faqPor("Qual sistema vocês usam?"), faqPor(CIDADES)],
    mensagem: "Olá! Quero orçamento de impermeabilização de fachada/junta.",
  },
  {
    slug: "correcao-de-infiltracao",
    aplicacao: "Correção de patologias",
    nome: "Correção de infiltração",
    titulo: "Correção de infiltração em Maceió | Verus Impermeabilizações",
    descricao:
      "Infiltração em obra já entregue em Maceió e Alagoas: diagnóstico da causa na visita técnica, abertura mínima e reparo com garantia por escrito.",
    intro: descAplicacao("Correção de patologias"),
    sinais: faqPor("Como sei se é infiltração ou só umidade?").r,
    sistemas: [],
    imagem: FOTO_VISITA,
    faq: [faqPor("Como sei se é infiltração ou só umidade?"), faqPor("Precisa quebrar o piso?"), faqPor("Atendem casa e apartamento?"), faqPor(GARANTIA)],
    mensagem: "Olá! Tenho infiltração e quero agendar uma visita técnica.",
  },
];

export const paginaPorSlug = (slug: string) => PAGINAS_SERVICO.find((p) => p.slug === slug);
export const paginaPorAplicacao = (titulo: string) => PAGINAS_SERVICO.find((p) => p.aplicacao === titulo);
export const descricaoSistema = (nome: string) => SISTEMAS.find(([n]) => n === nome)?.[1] ?? "";
