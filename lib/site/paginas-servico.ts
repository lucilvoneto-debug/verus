/**
 * Páginas por serviço do site (/impermeabilizacao/<slug>).
 * Todo texto aqui reaproveita o que a landing já afirma (lib/site/empresa.ts e
 * lib/site/perguntas.ts): não acrescentar promessa nova (prazo, garantia em anos, norma)
 * sem o dono confirmar.
 */
import { APLICACOES, SERVICOS, SISTEMAS } from "@/lib/site/empresa";
import { PERGUNTAS, type Pergunta } from "@/lib/site/perguntas";

export type PaginaServico = {
  slug: string;
  /** Título do card em APLICACOES — liga a página ao card da landing. */
  aplicacao: (typeof APLICACOES)[number]["titulo"];
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
    faq: [
      PERGUNTAS.oQueEFundacao,
      PERGUNTAS.infiltracaoParede,
      PERGUNTAS.orcamento,
      PERGUNTAS.sistema,
      PERGUNTAS.construtora,
      PERGUNTAS.garantia,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de fundação/subsolo.",
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
    faq: [
      PERGUNTAS.banheiro,
      PERGUNTAS.quebrarPiso,
      PERGUNTAS.bemFeita,
      PERGUNTAS.orcamento,
      PERGUNTAS.residencial,
    ],
    mensagem: "Olá! Quero orçamento de impermeabilização de banheiro/varanda.",
  },
  {
    slug: "fachadas-e-juntas",
    aplicacao: "Fachadas e juntas",
    nome: "Impermeabilização de fachadas e juntas",
    titulo: "Impermeabilização de fachada e junta de dilatação em Maceió | Verus Impermeabilizações",
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
  },
];

export const paginaPorSlug = (slug: string) => PAGINAS_SERVICO.find((p) => p.slug === slug);
export const paginaPorAplicacao = (titulo: string) => PAGINAS_SERVICO.find((p) => p.aplicacao === titulo);
export const descricaoSistema = (nome: string) => SISTEMAS.find(([n]) => n === nome)?.[1] ?? "";
