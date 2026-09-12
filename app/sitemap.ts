import type { MetadataRoute } from "next";
import { EMPRESA } from "@/lib/site/empresa";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${EMPRESA.site}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }];
}
