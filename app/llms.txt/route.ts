/**
 * /llms.txt — resumo do site em texto para assistentes de IA (proposta comunitária; o Google
 * diz que não usa, outros podem usar). Gerado dos mesmos dados da landing, sem texto novo.
 */
import { AREAS, EMPRESA, METODO } from "@/lib/site/empresa";
import { PAGINAS_SERVICO } from "@/lib/site/paginas-servico";
import { FAQ_HOME } from "@/lib/site/perguntas";

export const dynamic = "force-static";

function texto() {
  const site = EMPRESA.site;
  return [
    `# ${EMPRESA.nome}`,
    "",
    `> Empresa de impermeabilização para construção civil em ${EMPRESA.cidade}/${EMPRESA.uf} e mais ${AREAS.length - 1} cidades de Alagoas. ` +
      "Atende construtoras, condomínios, indústria, comércio e imóveis residenciais, com visita técnica sem custo, " +
      "orçamento por m², teste de estanqueidade e garantia por escrito.",
    "",
    "## Contato",
    `- WhatsApp e telefone: ${EMPRESA.telefoneFormatado}`,
    `- E-mail: ${EMPRESA.email}`,
    `- Horário (Maceió): ${EMPRESA.horario}`,
    `- Instagram: ${EMPRESA.instagram}`,
    `- Perfil no Google: ${EMPRESA.googleMaps}`,
    `- ${EMPRESA.razao} · CNPJ ${EMPRESA.cnpj}`,
    `- Cidades atendidas: ${AREAS.join(", ")}`,
    "",
    "## Serviços",
    ...PAGINAS_SERVICO.map((p) => `- [${p.nome}](${site}/impermeabilizacao/${p.slug}): ${p.descricao}`),
    "",
    "## Como funciona",
    ...METODO.map(([etapa, desc]) => `- ${etapa}: ${desc}`),
    "",
    "## Perguntas frequentes",
    ...FAQ_HOME.map((q) => `- [${q.p}](${site}/#duvidas): ${q.r}`),
    "",
  ].join("\n");
}

export function GET() {
  return new Response(texto(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
