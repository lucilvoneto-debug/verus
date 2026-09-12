"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { EMPRESA } from "@/lib/site/empresa";
import { textoWhatsApp } from "./Rastreio";

declare global {
  interface Window { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void }
}

export function dispararConversao(evento: "whatsapp" | "formulario" | "ligacao") {
  try {
    window.fbq?.("track", evento === "formulario" ? "Lead" : "Contact");
    const label =
      evento === "formulario" ? process.env.NEXT_PUBLIC_GADS_CONV_FORM : process.env.NEXT_PUBLIC_GADS_CONV_WA;
    if (label) window.gtag?.("event", "conversion", { send_to: label });
    window.gtag?.("event", evento === "formulario" ? "generate_lead" : `contact_${evento}`);
  } catch { /* sem tag */ }
}

export function useWaHref(mensagem?: string) {
  const [href, setHref] = useState(`https://wa.me/${EMPRESA.telefone}`);
  useEffect(() => {
    setHref(`https://wa.me/${EMPRESA.telefone}?text=${encodeURIComponent(textoWhatsApp(mensagem))}`);
  }, [mensagem]);
  return href;
}

export function WhatsAppCta({
  className = "",
  texto = "Falar no WhatsApp",
  mensagem,
  flutuante = false,
  variante = "verde",
}: {
  className?: string;
  texto?: string;
  mensagem?: string;
  flutuante?: boolean;
  variante?: "verde" | "branco";
}) {
  const href = useWaHref(mensagem);
  const base = flutuante
    ? "fixed bottom-5 right-5 z-40 hidden md:flex shadow-lg rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white px-5 py-3 font-semibold items-center gap-2"
    : variante === "branco"
      ? "inline-flex items-center justify-center gap-2 rounded-lg bg-white text-brand-dark hover:bg-brand-light font-semibold px-5 py-3 transition-colors"
      : "inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold px-5 py-3 transition-colors";
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={() => dispararConversao("whatsapp")} className={`${base} ${className}`}>
      <MessageCircle className="w-5 h-5" /> {texto}
    </a>
  );
}

/** Barra fixa no rodapé do celular: WhatsApp + ligar. Some no desktop. */
export function BarraMobile() {
  const href = useWaHref();
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden grid grid-cols-2 gap-2 p-2 bg-white/95 backdrop-blur border-t border-gray-200">
      <a href={`tel:+${EMPRESA.telefone}`} onClick={() => dispararConversao("ligacao")} className="btn-outline py-3 text-sm">Ligar agora</a>
      <a href={href} target="_blank" rel="noreferrer" onClick={() => dispararConversao("whatsapp")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white font-semibold py-3 text-sm">
        <MessageCircle className="w-4 h-4" /> WhatsApp
      </a>
    </div>
  );
}
