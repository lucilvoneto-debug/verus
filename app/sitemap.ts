import type { MetadataRoute } from "next";
import { EMPRESA } from "@/lib/site/empresa";
import { PAGINAS_SERVICO } from "@/lib/site/paginas-servico";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${EMPRESA.site}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    ...PAGINAS_SERVICO.map((p) => ({
      url: `${EMPRESA.site}/impermeabilizacao/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
