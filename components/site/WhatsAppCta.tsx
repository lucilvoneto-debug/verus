"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { EMPRESA } from "@/lib/site/empresa";
import { textoWhatsApp } from "./Rastreio";

declare global {
  interface Window { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void }
}

export function dispararConversao(evento: "whatsapp" | "formulario") {
  try {
    window.fbq?.("track", evento === "formulario" ? "Lead" : "Contact");
    const label = evento === "formulario" ? process.env.NEXT_PUBLIC_GADS_CONV_FORM : process.env.NEXT_PUBLIC_GADS_CONV_WA;
    if (label) window.gtag?.("event", "conversion", { send_to: label });
    window.gtag?.("event", evento === "formulario" ? "generate_lead" : "contact_whatsapp");
  } catch { /* sem tag */ }
}

export function WhatsAppCta({ className = "", texto = "Falar no WhatsApp", flutuante = false }: { className?: string; texto?: string; flutuante?: boolean }) {
  const [href, setHref] = useState(`https://wa.me/${EMPRESA.telefone}`);
  useEffect(() => {
    setHref(`https://wa.me/${EMPRESA.telefone}?text=${encodeURIComponent(textoWhatsApp())}`);
  }, []);
  const base = flutuante
    ? "fixed bottom-5 right-5 z-40 shadow-lg rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white px-5 py-3 font-semibold flex items-center gap-2"
    : "inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold px-5 py-3 transition-colors";
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={() => dispararConversao("whatsapp")} className={`${base} ${className}`}>
      <MessageCircle className="w-5 h-5" /> {texto}
    </a>
  );
}
