/**
 * JSON-LD da empresa, usado na landing e nas páginas por serviço.
 * Só dados que o site já publica (lib/site/empresa.ts). Sem endereço de rua: o Perfil da
 * Empresa no Google é de área de atendimento, então o endereço fica só cidade/UF.
 */
import { AREAS, EMPRESA, SISTEMAS } from "@/lib/site/empresa";
import { PAGINAS_SERVICO } from "@/lib/site/paginas-servico";

/** Identificador único da empresa nos dados estruturados de todas as páginas. */
export const ID_EMPRESA = `${EMPRESA.site}/#empresa`;

/** Tipo schema.org mais específico que cobre impermeabilização (construção e reforma). */
const TIPO = "HomeAndConstructionBusiness";

const ESTADO = { "@type": "State", name: "Alagoas" } as const;

export const areaServedJsonLd = AREAS.map((nome) => ({ "@type": "City", name: nome, containedInPlace: ESTADO }));

const endereco = { "@type": "PostalAddress", addressLocality: EMPRESA.cidade, addressRegion: EMPRESA.uf, addressCountry: "BR" };

/** Referência curta à empresa (provider das páginas de serviço). */
export const empresaRefJsonLd = {
  "@type": TIPO,
  "@id": ID_EMPRESA,
  name: EMPRESA.nome,
  url: EMPRESA.site,
  telephone: `+${EMPRESA.telefone}`,
  sameAs: [EMPRESA.instagram, EMPRESA.googleMaps],
  address: endereco,
};

/** Bloco completo da empresa (página inicial). */
export const empresaJsonLd = {
  "@context": "https://schema.org",
  ...empresaRefJsonLd,
  legalName: EMPRESA.razao,
  taxID: EMPRESA.cnpj,
  description:
    "Empresa de impermeabilização para construção civil em Maceió (AL): lajes e coberturas, fundações e subsolos, reservatórios e piscinas, banheiros, varandas e sacadas, fachadas e correção de infiltração, com teste de estanqueidade e garantia por escrito.",
  email: EMPRESA.email,
  image: `${EMPRESA.site}/site/logo.jpg`,
  logo: `${EMPRESA.site}/site/logo.jpg`,
  hasMap: EMPRESA.googleMaps,
  areaServed: areaServedJsonLd,
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "17:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "12:00" },
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: `+${EMPRESA.telefone}`,
    email: EMPRESA.email,
    contactType: "customer service",
    areaServed: "BR",
    availableLanguage: "Portuguese",
  },
  priceRange: "$$",
  knowsAbout: ["Impermeabilização", ...SISTEMAS.map(([nome]) => nome), "Teste de estanqueidade", "Correção de infiltração"],
  makesOffer: PAGINAS_SERVICO.map((p) => ({
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name: p.nome,
      description: p.descricao,
      url: `${EMPRESA.site}/impermeabilizacao/${p.slug}`,
    },
  })),
};

export const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${EMPRESA.site}/#site`,
  url: EMPRESA.site,
  name: EMPRESA.nome,
  inLanguage: "pt-BR",
  publisher: { "@id": ID_EMPRESA },
};
