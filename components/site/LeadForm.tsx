"use client";

import { useState } from "react";
import { lerCookie, lerRastreio } from "./Rastreio";
import { dispararConversao } from "./WhatsAppCta";

export function LeadForm() {
  const [f, setF] = useState({ nome: "", telefone: "", bairro: "", tipoImovel: "RESIDENCIAL", descricao: "", site: "" });
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    setErro(null);
    const r = lerRastreio();
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
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
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
        <p className="font-display text-xl font-bold text-emerald-800">Recebemos seu pedido!</p>
        <p className="text-sm text-emerald-700 mt-1">Vamos te chamar no WhatsApp em até 1 dia útil pra agendar a visita técnica.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <input className="input-verus" placeholder="Seu nome" required value={f.nome} onChange={set("nome")} />
      <input className="input-verus" placeholder="WhatsApp (82) 9xxxx-xxxx" required inputMode="tel" value={f.telefone} onChange={set("telefone")} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input-verus" placeholder="Bairro" value={f.bairro} onChange={set("bairro")} />
        <select className="input-verus" value={f.tipoImovel} onChange={set("tipoImovel")}>
          <option value="RESIDENCIAL">Casa / apartamento</option>
          <option value="CONDOMINIO">Condomínio</option>
          <option value="COMERCIAL">Comércio / empresa</option>
          <option value="INDUSTRIA">Indústria</option>
          <option value="OBRA">Obra / construtora</option>
        </select>
      </div>
      <textarea className="input-verus" rows={3} required placeholder="Onde está o problema? (ex.: infiltração na laje, piscina perdendo água…)" value={f.descricao} onChange={set("descricao")} />
      <input type="text" name="site" tabIndex={-1} autoComplete="off" className="hidden" value={f.site} onChange={set("site")} aria-hidden />
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button type="submit" className="btn-primary w-full py-3 text-base" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Quero um orçamento"}
      </button>
      <p className="text-[11px] text-gray-500 text-center">Sem compromisso. Visita técnica agendada pelo WhatsApp.</p>
    </form>
  );
}
