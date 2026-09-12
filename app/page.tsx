import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ShieldCheck, ClipboardCheck, Droplets, Clock, Phone, MapPin } from "lucide-react";
import { EMPRESA, SERVICOS } from "@/lib/site/empresa";
import { Rastreio } from "@/components/site/Rastreio";
import { WhatsAppCta } from "@/components/site/WhatsAppCta";
import { LeadForm } from "@/components/site/LeadForm";

export const metadata: Metadata = {
  title: `${EMPRESA.nome} — Impermeabilização em Maceió com garantia`,
  description:
    "Impermeabilização de lajes, coberturas, piscinas, reservatórios, subsolos e fachadas em Maceió e região. Visita técnica, laudo e garantia em contrato. Fale no WhatsApp.",
  metadataBase: new URL(EMPRESA.site),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${EMPRESA.nome} — Impermeabilização em Maceió`,
    description: "Acabe com a infiltração de vez. Visita técnica, orçamento por m² e garantia em contrato.",
    locale: "pt_BR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // Google tag (Ads / GA4): G-XXXX ou AW-XXXX
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: EMPRESA.nome,
  telephone: `+${EMPRESA.telefone}`,
  email: EMPRESA.email,
  url: EMPRESA.site,
  areaServed: EMPRESA.areas.map((a) => ({ "@type": "City", name: a })),
  address: { "@type": "PostalAddress", addressLocality: EMPRESA.cidade, addressRegion: EMPRESA.uf, addressCountry: "BR" },
  openingHours: ["Mo-Fr 07:00-18:00", "Sa 07:00-12:00"],
  priceRange: "$$",
  makesOffer: SERVICOS.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.titulo } })),
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Rastreio />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="gtag" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}</Script>
        </>
      )}
      {PIXEL_ID && (
        <Script id="fbq" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}</Script>
      )}

      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <div className="font-display text-xl font-bold text-brand-dark">Verus <span className="text-brand">Impermeabilizações</span></div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#servicos" className="hover:text-brand">Serviços</a>
            <a href="#como-funciona" className="hover:text-brand">Como funciona</a>
            <a href="#orcamento" className="hover:text-brand">Orçamento</a>
          </nav>
          <a href={`tel:+${EMPRESA.telefone}`} className="btn-outline text-sm"><Phone className="w-4 h-4" /> {EMPRESA.telefoneFormatado}</a>
        </div>
      </header>

      <section className="bg-gradient-to-br from-brand-dark via-brand to-brand-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand-light/90 text-sm font-medium uppercase tracking-wide">Maceió · Marechal Deodoro · Rio Largo</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mt-3">
              Infiltração de novo? A gente resolve — <span className="underline decoration-brand-light/60">com garantia em contrato</span>.
            </h1>
            <p className="mt-4 text-lg text-white/85">
              Lajes, coberturas, piscinas, reservatórios, subsolos e fachadas. Visita técnica, diagnóstico da causa e orçamento por m² sem enrolação.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <WhatsAppCta texto="Pedir orçamento no WhatsApp" />
              <a href="#orcamento" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-3 font-semibold hover:bg-white/10">Deixar meu contato</a>
            </div>
            <ul className="mt-8 grid grid-cols-3 gap-3 text-sm">
              <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-brand-light" /> Garantia por escrito</li>
              <li className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-brand-light" /> Laudo técnico</li>
              <li className="flex items-center gap-2"><Clock className="w-5 h-5 text-brand-light" /> Resposta em 1 dia útil</li>
            </ul>
          </div>
          <div id="orcamento" className="bg-white text-gray-900 rounded-2xl p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-brand-dark">Orçamento gratuito</h2>
            <p className="text-sm text-gray-500 mb-4">Conte o problema e a gente te chama no WhatsApp.</p>
            <LeadForm />
          </div>
        </div>
      </section>

      <section id="servicos" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-brand-dark">O que impermeabilizamos</h2>
        <p className="text-gray-600 mt-2">Sistema certo pra cada superfície — manta, poliureia, cimentício, poliuretano ou acrílico.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {SERVICOS.map((s) => (
            <div key={s.titulo} className="card hover:border-brand transition-colors">
              <Droplets className="w-6 h-6 text-brand" />
              <h3 className="font-display text-lg font-semibold mt-3">{s.titulo}</h3>
              <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold text-brand-dark">Como funciona</h2>
          <ol className="grid md:grid-cols-4 gap-5 mt-8">
            {[
              ["1", "Você chama", "WhatsApp ou formulário. Respondemos em até 1 dia útil."],
              ["2", "Visita técnica", "Vamos ao local, achamos a causa e medimos a área."],
              ["3", "Orçamento por m²", "Proposta com sistema indicado, prazo e garantia."],
              ["4", "Execução + garantia", "Equipe própria, termo de garantia e pós-venda."],
            ].map(([n, t, d]) => (
              <li key={n} className="card">
                <span className="font-display text-3xl font-bold text-brand">{n}</span>
                <h3 className="font-semibold mt-2">{t}</h3>
                <p className="text-sm text-gray-600 mt-1">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center"><WhatsAppCta texto="Agendar visita técnica" /></div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div>
          <p className="font-display font-semibold text-gray-800">{EMPRESA.nome}</p>
          <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {EMPRESA.areas.join(" · ")} — {EMPRESA.uf}</p>
          <p>{EMPRESA.horario}</p>
          <p><a href={`tel:+${EMPRESA.telefone}`}>{EMPRESA.telefoneFormatado}</a> · <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a></p>
        </div>
        <div className="flex gap-4">
          <Link href="/portal/login" className="hover:text-brand">Área do cliente</Link>
          <Link href="/login" className="hover:text-brand">Equipe</Link>
        </div>
      </footer>

      <WhatsAppCta flutuante texto="WhatsApp" />
    </div>
  );
}
