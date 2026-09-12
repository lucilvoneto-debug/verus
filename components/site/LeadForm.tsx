"use client";

import { useState } from "react";
import { lerCookie, lerRastreio } from "./Rastreio";
import { dispararConversao } from "./WhatsAppCta";

const TIPOS = [
  ["OBRA", "Construtora / obra"],
  ["CONDOMINIO", "Condomínio"],
  ["COMERCIAL", "Comércio / indústria"],
  ["RESIDENCIAL", "Casa / apartamento"],
] as const;

/**
 * Formulário de orçamento do site. Grava o lead no CRM (/api/leads) com a
 * origem da campanha. `tema="escuro"` é a versão para fundo escuro da landing.
 */
export function LeadForm({ tema = "claro" }: { tema?: "claro" | "escuro" }) {
  const [f, setF] = useState({ nome: "", telefone: "", empresa: "", tipoImovel: "OBRA", area: "", descricao: "", site: "" });
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const escuro = tema === "escuro";
  const input = escuro
    ? "w-full rounded border border-verus-line bg-verus-bg/60 px-3 py-2.5 text-sm text-verus-text placeholder:text-verus-muted/70 focus:border-verus-green focus:outline-none focus:ring-1 focus:ring-verus-green"
    : "input-verus";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setErro(null);
    const r = lerRastreio();
    // Empresa e área não têm campo próprio no lead — vão no texto, na frente.
    const prefixo = [f.empresa && `Empresa/obra: ${f.empresa}`, f.area && `Área aprox.: ${f.area} m²`].filter(Boolean).join(" · ");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: f.nome,
          telefone: f.telefone,
          tipoImovel: f.tipoImovel,
          descricao: prefixo ? `${prefixo}\n${f.descricao}` : f.descricao,
          site: f.site,
          cidade: "Maceió",
          utmSource: r.utm_source, utmMedium: r.utm_medium, utmCampaign: r.utm_campaign, utmTerm: r.utm_term, utmContent: r.utm_content,
          gclid: r.gclid, fbclid: r.fbclid, fbc: lerCookie("_fbc"), fbp: lerCookie("_fbp"),
          landingPage: r.landingPage ?? window.location.href, referrer: r.referrer ?? document.referrer,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.issues?.fieldErrors ? Object.values(d.issues.fieldErrors).flat().join(" · ") : d.error ?? "Erro");
      setEstado("ok");
      dispararConversao("formulario");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar");
      setEstado("erro");
    }
  }

  if (estado === "ok") {
    return (
      <div className={`rounded-lg border p-6 text-center ${escuro ? "border-verus-green/40 bg-verus-green/10" : "bg-emerald-50 border-emerald-200"}`}>
        <p className={`font-display text-xl font-bold ${escuro ? "text-verus-text" : "text-emerald-800"}`}>Recebemos seu pedido.</p>
        <p className={`text-sm mt-1 ${escuro ? "text-verus-muted" : "text-emerald-700"}`}>Um técnico da Verus responde no WhatsApp em até 1 dia útil para agendar a visita.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input className={input} placeholder="Seu nome" required value={f.nome} onChange={set("nome")} />
        <input className={input} placeholder="WhatsApp (82) 9xxxx-xxxx" required inputMode="tel" value={f.telefone} onChange={set("telefone")} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input className={input} placeholder="Empresa ou nome da obra (opcional)" value={f.empresa} onChange={set("empresa")} />
        <select className={input} value={f.tipoImovel} onChange={set("tipoImovel")}>
          {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="grid sm:grid-cols-[1fr_2fr] gap-3">
        <input className={input} placeholder="Área aprox. (m²)" inputMode="numeric" value={f.area} onChange={set("area")} />
        <input className={input} required placeholder="O que precisa impermeabilizar? (laje, reservatório, subsolo…)" value={f.descricao} onChange={set("descricao")} />
      </div>
      <input type="text" name="site" tabIndex={-1} autoComplete="off" className="hidden" value={f.site} onChange={set("site")} aria-hidden />
      {erro && <p className="text-sm text-red-400">{erro}</p>}
      <button
        type="submit"
        className="w-full rounded bg-verus-green hover:bg-verus-greenDark text-white font-semibold py-3 text-base transition-colors disabled:opacity-60"
        disabled={estado === "enviando"}
      >
        {estado === "enviando" ? "Enviando…" : "Solicitar orçamento técnico"}
      </button>
      <p className={`text-[11px] text-center ${escuro ? "text-verus-muted/80" : "text-gray-500"}`}>Sem compromisso. Visita técnica e orçamento por m² sem custo.</p>
    </form>
  );
}
