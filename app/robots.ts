import type { MetadataRoute } from "next";
import { EMPRESA } from "@/lib/site/empresa";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/api", "/portal", "/campo", "/login", "/entrar"] }],
    sitemap: `${EMPRESA.site}/sitemap.xml`,
  };
}
