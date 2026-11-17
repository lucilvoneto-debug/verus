import type { MetadataRoute } from "next";
import { EMPRESA } from "@/lib/site/empresa";
import { PAGINAS_SERVICO } from "@/lib/site/paginas-servico";
import { REVISADO_EM } from "@/lib/site/perguntas";

/** Data da última mudança real de conteúdo (não a data do build, que muda a cada deploy). */
const ATUALIZADO = new Date(`${REVISADO_EM}T12:00:00-03:00`);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${EMPRESA.site}/`, lastModified: ATUALIZADO, changeFrequency: "weekly", priority: 1 },
    ...PAGINAS_SERVICO.map((p) => ({
      url: `${EMPRESA.site}/impermeabilizacao/${p.slug}`,
      lastModified: ATUALIZADO,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
