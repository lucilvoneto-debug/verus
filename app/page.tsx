import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import {
  ShieldCheck, ClipboardCheck, Droplets, Clock, Phone, MapPin, Instagram, CheckCircle2, FlaskConical, FileText,
} from "lucide-react";
import { AREAS, EMPRESA, ETAPAS, FAQ, SERVICOS, SISTEMAS } from "@/lib/site/empresa";
import { Rastreio } from "@/components/site/Rastreio";
import { BarraMobile, WhatsAppCta } from "@/components/site/WhatsAppCta";
import { LeadForm } from "@/components/site/LeadForm";
import { Faq } from "@/components/site/Faq";

export const metadata: Metadata = {
  title: `Impermeabilização em Maceió com garantia | ${EMPRESA.nome}`,
  description:
    "Infiltração na laje, piscina perdendo água, umidade no subsolo? Visita técnica sem custo, orçamento por m² e garantia em contrato. Atendemos Maceió e mais 19 cidades de Alagoas.",
  metadataBase: new URL(EMPRESA.site),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${EMPRESA.nome} — Impermeabilização em Maceió`,
    description: "Acabe com a infiltração de vez. Visita técnica, orçamento por m² e garantia em contrato.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/site/piscina-manta.jpg", width: 1066, height: 711, alt: "Aplicação de manta asfáltica em piscina" }],
  },
  robots: { index: true, follow: true },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // Google tag (Ads / GA4): G-XXXX ou AW-XXXX
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: EMPRESA.nome,
    legalName: EMPRESA.razao,
    taxID: EMPRESA.cnpj,
    telephone: `+${EMPRESA.telefone}`,
    email: EMPRESA.email,
    url: EMPRESA.site,
    image: `${EMPRESA.site}/site/logo.jpg`,
    sameAs: [EMPRESA.instagram],
    areaServed: AREAS.map((a) => ({ "@type": "City", name: a })),
    address: { "@type": "PostalAddress", addressLocality: EMPRESA.cidade, addressRegion: EMPRESA.uf, addressCountry: "BR" },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "17:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "08:00", closes: "12:00" },
    ],
    priceRange: "$$",
    makesOffer: SERVICOS.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: `Impermeabilização de ${s.titulo.toLowerCase()}` } })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 pb-16 md:pb-0">
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

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <a href="#topo" className="flex items-center gap-2">
            <Image src="/site/logo.jpg" alt="" width={36} height={36} className="rounded" priority />
            <span className="font-display text-lg md:text-xl font-bold text-brand-dark">Verus <span className="text-brand">Impermeabilizações</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#servicos" className="hover:text-brand">Serviços</a>
            <a href="#como-funciona" className="hover:text-brand">Como funciona</a>
            <a href="#faq" className="hover:text-brand">Dúvidas</a>
            <a href="#areas" className="hover:text-brand">Cidades</a>
          </nav>
          <a href={`tel:+${EMPRESA.telefone}`} className="btn-outline text-sm hidden sm:inline-flex"><Phone className="w-4 h-4" /> {EMPRESA.telefoneFormatado}</a>
        </div>
      </header>

      {/* Hero */}
      <section id="topo" className="relative bg-brand-dark text-white overflow-hidden">
        <Image src="/site/piscina-manta.jpg" alt="" fill className="object-cover opacity-25" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand/70" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-brand-light/90 text-sm font-medium uppercase tracking-wide">Maceió e mais 19 cidades de Alagoas</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mt-3">
              Infiltração na laje, piscina ou parede? <span className="text-brand-light">A gente acha a causa e resolve com garantia.</span>
            </h1>
            <p className="mt-4 text-lg text-white/85">
              Visita técnica sem custo, orçamento por m² e garantia por escrito no contrato. Manta asfáltica, poliureia, cimentício — o sistema certo pra cada superfície.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <WhatsAppCta texto="Pedir orçamento no WhatsApp" mensagem="Olá! Tenho um problema de infiltração e quero agendar uma visita técnica." />
              <a href="#orcamento" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-5 py-3 font-semibold hover:bg-white/10">Deixar meu contato</a>
            </div>
            <ul className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-brand-light shrink-0" /> Garantia em contrato</li>
              <li className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-brand-light shrink-0" /> Laudo técnico</li>
              <li className="flex items-center gap-2"><FlaskConical className="w-5 h-5 text-brand-light shrink-0" /> Teste de estanqueidade</li>
              <li className="flex items-center gap-2"><Clock className="w-5 h-5 text-brand-light shrink-0" /> Resposta em 1 dia útil</li>
            </ul>
          </div>
          <div id="orcamento" className="bg-white text-gray-900 rounded-2xl p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-bold text-brand-dark">Visita técnica sem custo</h2>
            <p className="text-sm text-gray-500 mb-4">Conte o problema e a gente te chama no WhatsApp pra agendar.</p>
            <LeadForm />
          </div>
        </div>
      </section>

      {/* Sinais de infiltração */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-8 items-center">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand-dark">Reconhece algum desses sinais?</h2>
            <ul className="mt-5 space-y-3 text-gray-700">
              {[
                "Mancha no teto que cresce depois da chuva",
                "Bolha, descascado ou mofo na pintura",
                "Piscina ou caixa d'água perdendo nível sem explicação",
                "Parede do subsolo ou da garagem sempre úmida",
                "Goteira em varanda, sacada ou banheiro do andar de baixo",
                "Fissura na fachada por onde a chuva de vento entra",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-brand mt-0.5 shrink-0" /> {s}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-gray-500">Pintar por cima não resolve: a água continua entrando por trás. Impermeabilizar trata a origem.</p>
            <div className="mt-6"><WhatsAppCta texto="Quero uma visita técnica" mensagem="Olá! Reconheci sinais de infiltração e quero agendar uma visita técnica." /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Image src="/site/visita-tecnica.jpg" alt="Visita técnica da Verus em obra" width={640} height={1138} className="rounded-xl object-cover h-64 md:h-80 w-full" sizes="(max-width: 768px) 50vw, 30vw" />
            <Image src="/site/obra-material.jpg" alt="Equipe da Verus carregando material para obra" width={640} height={853} className="rounded-xl object-cover h-64 md:h-80 w-full" sizes="(max-width: 768px) 50vw, 30vw" />
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section id="servicos" className="bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold text-brand-dark">O que impermeabilizamos</h2>
          <p className="text-gray-600 mt-2">Residência, condomínio, comércio, indústria e obra nova.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {SERVICOS.map((s) => (
              <div key={s.titulo} className="card hover:border-brand transition-colors relative">
                {s.tag && <span className="absolute top-4 right-4 badge-blue">{s.tag}</span>}
                <Droplets className="w-6 h-6 text-brand" />
                <h3 className="font-display text-lg font-semibold mt-3">{s.titulo}</h3>
                <p className="text-sm text-gray-600 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sistemas */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-brand-dark">Sistema certo pra cada superfície</h2>
        <p className="text-gray-600 mt-2">Não existe produto milagroso. Existe diagnóstico + sistema adequado + aplicação bem feita.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {SISTEMAS.map(([nome, desc]) => (
            <div key={nome} className="flex gap-3 rounded-xl border border-gray-200 p-4">
              <FileText className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">{nome}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-brand-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">Como funciona</h2>
          <ol className="grid md:grid-cols-5 gap-4 mt-8">
            {ETAPAS.map(([t, d], i) => (
              <li key={t} className="rounded-xl bg-white/10 p-5">
                <span className="font-display text-3xl font-bold text-brand-light">{i + 1}</span>
                <h3 className="font-semibold mt-2">{t}</h3>
                <p className="text-sm text-white/80 mt-1">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center">
            <WhatsAppCta texto="Agendar visita técnica" variante="branco" mensagem="Olá! Quero agendar uma visita técnica de impermeabilização." />
            <a href={`tel:+${EMPRESA.telefone}`} className="inline-flex items-center gap-2 text-white/90 hover:text-white"><Phone className="w-4 h-4" /> ou ligue {EMPRESA.telefoneFormatado}</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-brand-dark">Dúvidas frequentes</h2>
        <div className="mt-6"><Faq itens={FAQ} /></div>
      </section>

      {/* Áreas */}
      <section id="areas" className="bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl font-bold text-brand-dark flex items-center gap-2"><MapPin className="w-6 h-6 text-brand" /> Cidades atendidas em Alagoas</h2>
          <p className="text-sm text-gray-600 mt-2">Impermeabilização em {AREAS.join(", ")}.</p>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-brand-dark">Quanto mais tempo a água entra, mais caro fica.</h2>
        <p className="text-gray-600 mt-2">Chame agora. Visita técnica sem custo e orçamento por m² em Maceió e região.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <WhatsAppCta texto="Chamar no WhatsApp" />
          <a href="#orcamento" className="btn-outline py-3">Preencher formulário</a>
        </div>
      </section>

      <footer className="border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500 flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
          <div>
            <p className="font-display font-semibold text-gray-800">{EMPRESA.nome}</p>
            <p>{EMPRESA.razao} · CNPJ {EMPRESA.cnpj}</p>
            <p>{EMPRESA.horario}</p>
            <p><a href={`tel:+${EMPRESA.telefone}`} className="hover:text-brand">{EMPRESA.telefoneFormatado}</a> · <a href={`mailto:${EMPRESA.email}`} className="hover:text-brand">{EMPRESA.email}</a></p>
            <a href={EMPRESA.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 hover:text-brand"><Instagram className="w-4 h-4" /> @verusimpermeabilizacoes</a>
          </div>
          <div className="flex gap-4">
            <Link href="/portal/login" className="hover:text-brand">Área do cliente</Link>
            <Link href="/login" className="hover:text-brand">Equipe</Link>
          </div>
        </div>
      </footer>

      <WhatsAppCta flutuante texto="WhatsApp" />
      <BarraMobile />
    </div>
  );
}
