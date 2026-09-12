import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Sora, Manrope } from "next/font/google";
import {
  ShieldCheck, ClipboardCheck, FlaskConical, CalendarClock, Phone, MapPin, Instagram, CheckCircle2,
  Layers, ArrowRight, LogIn, FileText, Home as HomeIcon,
} from "lucide-react";
import {
  APLICACOES, AREAS, CAMADAS, EMPRESA, ENTREGAVEIS, FAQ_OBRA, METODO, PUBLICOS, SISTEMAS,
} from "@/lib/site/empresa";
import { Rastreio } from "@/components/site/Rastreio";
import { BarraMobile, WhatsAppCta } from "@/components/site/WhatsAppCta";
import { LeadForm } from "@/components/site/LeadForm";
import { Faq } from "@/components/site/Faq";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-sora", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: `Impermeabilização para construção civil em Maceió | ${EMPRESA.nome}`,
  description:
    "Impermeabilização de lajes, fundações, reservatórios e áreas molhadas para construtoras, condomínios e obras em Maceió e Alagoas. Especificação, execução com teste de estanqueidade e garantia por escrito.",
  metadataBase: new URL(EMPRESA.site),
  alternates: { canonical: "/" },
  openGraph: {
    title: `${EMPRESA.nome} — Impermeabilização para construção civil`,
    description: "Verus protege sua obra contra infiltrações. Diagnóstico, especificação, execução controlada e entrega com garantia.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/site/piscina-manta.jpg", width: 1066, height: 711, alt: "Aplicação de manta asfáltica em piscina" }],
  },
  robots: { index: true, follow: true },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // Google tag (Ads / GA4): G-XXXX ou AW-XXXX
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const MSG_OBRA = "Olá! Sou de uma obra/construtora e quero um orçamento de impermeabilização.";

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
    makesOffer: APLICACOES.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: `Impermeabilização de ${s.titulo.toLowerCase()}` } })),
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_OBRA.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })),
  },
];

const Titulo = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`font-sora text-3xl md:text-4xl font-bold leading-tight text-verus-text ${className}`}>{children}</h2>
);
const Rotulo = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-verus-green">{children}</p>
);

export default function Home() {
  return (
    <div className={`${sora.variable} ${manrope.variable} font-manrope min-h-screen bg-verus-bg text-verus-text pb-16 md:pb-0`}>
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
      <header className="sticky top-0 z-30 bg-verus-bg/90 backdrop-blur border-b border-verus-line/60">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <a href="#topo" className="flex items-center gap-2.5">
            <Image src="/site/logo.jpg" alt="" width={34} height={34} className="rounded" priority />
            <span className="font-sora text-lg font-bold tracking-tight">Verus</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-verus-muted">
            <a href="#aplicacoes" className="hover:text-verus-text">Aplicações</a>
            <a href="#sistema" className="hover:text-verus-text">Sistema</a>
            <a href="#metodo" className="hover:text-verus-text">Método</a>
            <a href="#duvidas" className="hover:text-verus-text">Dúvidas</a>
            <a href="#contato" className="hover:text-verus-text">Contato</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded border border-verus-line px-3 py-2 text-sm font-semibold text-verus-muted hover:text-verus-text hover:border-verus-muted transition-colors">
              <LogIn className="w-4 h-4" /> Entrar
            </Link>
            <WhatsAppCta texto="Orçamento no WhatsApp" mensagem={MSG_OBRA} className="hidden sm:inline-flex !py-2 !px-4 text-sm" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="topo" className="relative overflow-hidden">
        <Image src="/site/piscina-manta.jpg" alt="" fill className="object-cover opacity-[0.14]" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-b from-verus-bg/40 via-verus-bg/80 to-verus-bg" />
        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 md:pt-24 md:pb-20 grid lg:grid-cols-[1.15fr_1fr] gap-10 items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-verus-line bg-verus-card/70 px-3 py-1 text-xs font-medium text-verus-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-verus-green" /> Impermeabilização para construção civil · Maceió e Alagoas
            </span>
            <h1 className="font-sora text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mt-5">
              Verus protege sua obra contra infiltrações.
            </h1>
            <p className="mt-5 text-lg text-verus-muted max-w-xl">
              Especificação, execução e garantia de impermeabilização para lajes, fundações, reservatórios e áreas molhadas.
              Para construtora, condomínio e indústria — com teste de estanqueidade e termo de garantia por escrito.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <WhatsAppCta texto="Pedir orçamento no WhatsApp" mensagem={MSG_OBRA} />
              <a href="#aplicacoes" className="inline-flex items-center justify-center gap-2 rounded border border-verus-line px-5 py-3 font-semibold hover:border-verus-muted transition-colors">
                Ver aplicações <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <ul className="mt-9 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-verus-muted">
              <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-verus-green shrink-0" /> Garantia em contrato</li>
              <li className="flex items-center gap-2"><FlaskConical className="w-5 h-5 text-verus-green shrink-0" /> Teste de estanqueidade</li>
              <li className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-verus-green shrink-0" /> Memorial e laudo</li>
              <li className="flex items-center gap-2"><CalendarClock className="w-5 h-5 text-verus-green shrink-0" /> Cronograma da obra</li>
            </ul>
          </div>
          <div id="orcamento" className="rounded-lg border border-verus-line bg-verus-card/90 backdrop-blur p-6 shadow-2xl shadow-black/30">
            <Rotulo>Orçamento técnico</Rotulo>
            <h2 className="font-sora text-2xl font-bold mt-1">Resposta em até 1 dia útil</h2>
            <p className="text-sm text-verus-muted mt-1 mb-4">Conte o que a obra precisa. Um técnico responde no WhatsApp e agenda a visita.</p>
            <LeadForm tema="escuro" />
          </div>
        </div>
      </section>

      {/* Para quem */}
      <section className="border-y border-verus-line/60 bg-verus-bg2">
        <div className="mx-auto max-w-6xl px-4 py-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-verus-muted">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-verus-green">Atendemos</span>
          {PUBLICOS.map((p) => (
            <span key={p} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-verus-green" /> {p}</span>
          ))}
        </div>
      </section>

      {/* Por que na obra */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid md:grid-cols-[1fr_1.1fr] gap-10 items-center">
        <div>
          <Rotulo>Custo de errar</Rotulo>
          <Titulo className="mt-2">Infiltração descoberta depois da entrega custa demolição, retrabalho e reclamação.</Titulo>
          <p className="mt-4 text-verus-muted">
            Impermeabilizar na etapa certa custa uma etapa. Corrigir com o piso pronto custa quebrar, refazer, repintar — e a
            confiança do cliente final. A Verus entra na obra com sistema especificado por área e libera cada etapa só depois
            do teste de estanqueidade.
          </p>
          <ul className="mt-6 space-y-3 text-verus-text">
            {[
              "Sistema escolhido pelo substrato, não por catálogo",
              "Detalhes críticos resolvidos: ralo, soleira, rodapé, junta e passagem de tubulação",
              "Cada área testada antes de liberar a próxima etapa",
              "Registro fotográfico e laudo para o seu dossiê da obra",
            ].map((s) => (
              <li key={s} className="flex items-start gap-2"><CheckCircle2 className="w-5 h-5 text-verus-green mt-0.5 shrink-0" /> {s}</li>
            ))}
          </ul>
          <div className="mt-7"><WhatsAppCta texto="Falar com um técnico" mensagem={MSG_OBRA} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Image src="/site/visita-tecnica.jpg" alt="Técnico da Verus em visita de diagnóstico" width={640} height={1138} className="rounded-lg object-cover h-72 md:h-96 w-full border border-verus-line" sizes="(max-width: 768px) 50vw, 30vw" />
          <Image src="/site/piscina-manta.jpg" alt="Manta asfáltica aplicada em piscina" width={1066} height={711} className="rounded-lg object-cover h-72 md:h-96 w-full border border-verus-line" sizes="(max-width: 768px) 50vw, 30vw" />
        </div>
      </section>

      {/* Aplicações */}
      <section id="aplicacoes" className="bg-verus-bg2 border-y border-verus-line/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Rotulo>Aplicações</Rotulo>
          <Titulo className="mt-2">Proteção onde a obra mais exige.</Titulo>
          <p className="text-verus-muted mt-3 max-w-2xl">Obra nova, reforma e correção de patologia, com o sistema adequado ao tipo de estrutura.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-9">
            {APLICACOES.map((s) => (
              <div key={s.titulo} className="relative rounded-lg border border-verus-line bg-verus-card p-6 hover:border-verus-green/60 transition-colors">
                {"tag" in s && s.tag && <span className="absolute top-4 right-4 rounded-full bg-verus-green/15 text-verus-green text-[11px] font-semibold px-2.5 py-1">{s.tag}</span>}
                <Layers className="w-6 h-6 text-verus-green" />
                <h3 className="font-sora text-lg font-semibold mt-4">{s.titulo}</h3>
                <p className="text-sm text-verus-muted mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sistema técnico */}
      <section id="sistema" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-10">
          <div>
            <Rotulo>Sistema técnico</Rotulo>
            <Titulo className="mt-2">Camadas de proteção.</Titulo>
            <p className="text-verus-muted mt-3">Impermeabilização não é acabamento: é desempenho. Cada camada tem função e é conferida antes da próxima.</p>
            <ol className="mt-8 space-y-4">
              {CAMADAS.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="font-sora text-2xl font-bold text-verus-green w-10 shrink-0">0{i + 1}</span>
                  <div>
                    <h3 className="font-semibold">{t}</h3>
                    <p className="text-sm text-verus-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="text-sm font-semibold text-verus-muted mb-3">Sistemas que executamos</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {SISTEMAS.map(([nome, desc]) => (
                <div key={nome} className="flex gap-3 rounded-lg border border-verus-line bg-verus-card/60 p-4">
                  <FileText className="w-5 h-5 text-verus-green shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{nome}</h3>
                    <p className="text-sm text-verus-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Método */}
      <section id="metodo" className="bg-verus-bg2 border-y border-verus-line/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <Rotulo>Método Verus</Rotulo>
          <Titulo className="mt-2">Da análise à entrega, cada etapa é verificável.</Titulo>
          <ol className="grid md:grid-cols-4 gap-4 mt-9">
            {METODO.map(([t, d], i) => (
              <li key={t} className="rounded-lg border border-verus-line bg-verus-card p-6">
                <span className="font-sora text-3xl font-bold text-verus-green">0{i + 1}</span>
                <h3 className="font-sora font-semibold mt-3">{t}</h3>
                <p className="text-sm text-verus-muted mt-2 leading-relaxed">{d}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-lg border border-verus-line bg-verus-card/60 p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <p className="font-sora text-xl font-semibold">O que você recebe ao final</p>
              <ul className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-verus-muted">
                {ENTREGAVEIS.map((e) => (
                  <li key={e} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-verus-green shrink-0" /> {e}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-verus-muted">
                Cliente acompanha a obra pelo <Link href="/portal/login" className="text-verus-green underline underline-offset-2">portal online</Link>: etapas, fotos, propostas e garantia no mesmo lugar.
              </p>
            </div>
            <WhatsAppCta texto="Agendar diagnóstico" mensagem={MSG_OBRA} className="md:whitespace-nowrap" />
          </div>
        </div>
      </section>

      {/* Residencial (público secundário) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-lg border border-verus-line bg-verus-card/40 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
          <HomeIcon className="w-8 h-8 text-verus-green shrink-0" />
          <div className="flex-1">
            <p className="font-sora text-xl font-semibold">Infiltração em casa ou apartamento?</p>
            <p className="text-sm text-verus-muted mt-1">Laje, piscina, varanda ou parede: também atendemos imóvel residencial. Visita técnica sem custo e orçamento por m².</p>
          </div>
          <WhatsAppCta texto="Agendar visita" variante="contorno" mensagem="Olá! Tenho infiltração em casa e quero agendar uma visita técnica." />
        </div>
      </section>

      {/* FAQ */}
      <section id="duvidas" className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <Rotulo>Dúvidas frequentes</Rotulo>
        <Titulo className="mt-2">Antes de fechar, o que engenheiro e síndico perguntam.</Titulo>
        <div className="mt-7"><Faq itens={FAQ_OBRA} tema="escuro" /></div>
      </section>

      {/* Contato */}
      <section id="contato" className="bg-verus-bg2 border-y border-verus-line/60">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20 grid lg:grid-cols-[1fr_1fr] gap-10 items-start">
          <div>
            <Rotulo>Contato</Rotulo>
            <Titulo className="mt-2">Vamos avaliar sua obra?</Titulo>
            <p className="text-verus-muted mt-3">Envie as informações do projeto e receba uma orientação inicial para especificar a impermeabilização correta.</p>
            <div className="mt-7 space-y-3 text-sm">
              <a href={`https://wa.me/${EMPRESA.telefone}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-verus-green"><Phone className="w-5 h-5 text-verus-green" /> WhatsApp {EMPRESA.telefoneFormatado}</a>
              <a href={`mailto:${EMPRESA.email}`} className="flex items-center gap-3 hover:text-verus-green"><FileText className="w-5 h-5 text-verus-green" /> {EMPRESA.email}</a>
              <p className="flex items-center gap-3 text-verus-muted"><CalendarClock className="w-5 h-5 text-verus-green" /> {EMPRESA.horario}</p>
              <p className="flex items-center gap-3 text-verus-muted"><MapPin className="w-5 h-5 text-verus-green" /> {EMPRESA.cidade}/{EMPRESA.uf} e mais {AREAS.length - 1} cidades de Alagoas</p>
            </div>
            <div className="mt-8"><WhatsAppCta texto="Pedir orçamento no WhatsApp" mensagem={MSG_OBRA} /></div>
          </div>
          <div className="rounded-lg border border-verus-line bg-verus-card p-6">
            <p className="font-sora text-xl font-semibold">Ou deixe os dados da obra</p>
            <p className="text-sm text-verus-muted mt-1 mb-4">Um técnico responde no WhatsApp em até 1 dia útil.</p>
            <LeadForm tema="escuro" />
          </div>
        </div>
      </section>

      {/* Cidades */}
      <section className="mx-auto max-w-6xl px-4 py-10 text-sm text-verus-muted">
        <p className="flex items-center gap-2 font-semibold text-verus-text"><MapPin className="w-4 h-4 text-verus-green" /> Cidades atendidas em Alagoas</p>
        <p className="mt-2">Impermeabilização em {AREAS.join(", ")}.</p>
      </section>

      <footer className="border-t border-verus-line/60">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-verus-muted flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
          <div>
            <p className="font-sora font-semibold text-verus-text">{EMPRESA.nome}</p>
            <p>Construção civil · Proteção estrutural · Durabilidade</p>
            <p className="mt-2">{EMPRESA.razao} · CNPJ {EMPRESA.cnpj}</p>
            <p><a href={`tel:+${EMPRESA.telefone}`} className="hover:text-verus-green">{EMPRESA.telefoneFormatado}</a> · <a href={`mailto:${EMPRESA.email}`} className="hover:text-verus-green">{EMPRESA.email}</a></p>
            <a href={EMPRESA.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 hover:text-verus-green"><Instagram className="w-4 h-4" /> @verusimpermeabilizacoes</a>
          </div>
          <div className="flex gap-5">
            <Link href="/portal/login" className="hover:text-verus-green">Área do cliente</Link>
            <Link href="/login" className="inline-flex items-center gap-1 hover:text-verus-green"><LogIn className="w-4 h-4" /> Entrar no sistema</Link>
          </div>
        </div>
      </footer>

      <WhatsAppCta flutuante texto="WhatsApp" mensagem={MSG_OBRA} />
      <BarraMobile />
    </div>
  );
}
