import type { MetadataRoute } from "next";
import { EMPRESA } from "@/lib/site/empresa";

/** Rotas do sistema (ERP, portal, login): fora de qualquer robô. */
const ROTAS_DO_SISTEMA = ["/dashboard", "/api", "/portal", "/campo", "/login", "/entrar"];

/**
 * Robôs de busca que citam o site nas respostas (Google/AI Overviews, Bing/Copilot,
 * ChatGPT Search, Claude, Perplexity). Grupo próprio só para deixar explícito que podem ler
 * o site; as regras são as mesmas do "*". Robôs de treino (GPTBot, ClaudeBot, Google-Extended,
 * CCBot) seguem no "*" como antes: política não mudou.
 */
const ROBOS_DE_BUSCA = ["Googlebot", "Bingbot", "OAI-SearchBot", "Claude-SearchBot", "PerplexityBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ROBOS_DE_BUSCA, allow: "/", disallow: ROTAS_DO_SISTEMA },
      { userAgent: "*", allow: "/", disallow: ROTAS_DO_SISTEMA },
    ],
    sitemap: `${EMPRESA.site}/sitemap.xml`,
  };
}
