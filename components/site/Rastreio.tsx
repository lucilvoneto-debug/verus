"use client";

import { useEffect } from "react";

/**
 * Captura utm_*, gclid, fbclid da URL na primeira visita e guarda por 90 dias.
 * O formulário e os links de WhatsApp leem daqui — assim o lead chega no CRM
 * com a campanha certa mesmo que a pessoa navegue antes de converter.
 */
export const CHAVE_RASTREIO = "verus_rastreio";
const CAMPOS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"] as const;

export type Rastreio = Partial<Record<(typeof CAMPOS)[number], string>> & {
  landingPage?: string;
  referrer?: string;
  em?: number;
};

export function lerRastreio(): Rastreio {
  try {
    const raw = localStorage.getItem(CHAVE_RASTREIO);
    if (!raw) return {};
    const r = JSON.parse(raw) as Rastreio;
    if (r.em && Date.now() - r.em > 90 * 86400000) return {};
    return r;
  } catch {
    return {};
  }
}

export function lerCookie(nome: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${nome}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/** Texto do wa.me com a tag "(ref: fonte/campanha)" que o webhook usa pra atribuir a origem. */
export function textoWhatsApp(base = "Olá! Quero um orçamento de impermeabilização."): string {
  const r = typeof window === "undefined" ? {} : lerRastreio();
  const fonte = r.gclid ? "google-ads" : r.utm_source ?? (r.fbclid ? "meta" : "site");
  const camp = r.utm_campaign ?? "";
  return `${base} (ref: ${fonte}${camp ? "/" + camp : ""})`;
}

export function Rastreio() {
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const atual = lerRastreio();
      const novo: Rastreio = { ...atual };
      let mudou = false;
      for (const c of CAMPOS) {
        const v = sp.get(c);
        if (v) { novo[c] = v; mudou = true; }
      }
      if (!atual.landingPage || mudou) {
        novo.landingPage = window.location.href.slice(0, 500);
        novo.referrer = document.referrer.slice(0, 500);
        novo.em = Date.now();
        localStorage.setItem(CHAVE_RASTREIO, JSON.stringify(novo));
      }
    } catch { /* storage bloqueado */ }
  }, []);
  return null;
}
