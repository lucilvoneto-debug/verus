import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sora, Manrope } from "next/font/google";
import { ArrowRight, CalendarClock, CheckCircle2, FileText, Layers, LogIn, MapPin, Phone, ShieldCheck } from "lucide-react";
import { AREAS, CAMADAS, EMPRESA, ENTREGAVEIS } from "@/lib/site/empresa";
import { PAGINAS_SERVICO, descricaoSistema, paginaPorSlug } from "@/lib/site/paginas-servico";
import { Rastreio } from "@/components/site/Rastreio";
import { BarraMobile, WhatsAppCta } from "@/components/site/WhatsAppCta";
import { LeadForm } from "@/components/site/LeadForm";
import { Faq } from "@/components/site/Faq";

const sora = Sora({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-sora", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-manrope", display: "swap" });

export const dynamicParams = false;

export function generateStaticParams() {
  return PAGINAS_SERVICO.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const pagina = paginaPorSlug(params.slug);
  if (!pagina) return {};
  const caminho = `/impermeabilizacao/${pagina.slug}`;
  return {
    title: { absolute: pagina.titulo },
    description: pagina.descricao,
    metadataBase: new URL(EMPRESA.site),
    alternates: { canonical: caminho },
    openGraph: {
      title: pagina.titulo,
      description: pagina.descricao,
      url: caminho,
      locale: "pt_BR",
      type: "website",
      images: [{ url: pagina.imagem.src, width: pagina.imagem.largura, height: pagina.imagem.altura, alt: pagina.imagem.alt }],
    },
    robots: { index: true, follow: true },
  };
}

const Titulo = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`font-sora text-3xl md:text-4xl font-bold leading-tight text-verus-text ${className}`}>{children}</h2>
);
const Rotulo = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-verus-green">{children}</p>
);

export default function PaginaServico({ params }: { params: { slug: string } }) {
  const pagina = paginaPorSlug(params.slug);
  if (!pagina) notFound();

  const url = `${EMPRESA.site}/impermeabilizacao/${pagina.slug}`;
  const outras = PAGINAS_SERVICO.filter((p) => p.slug !== pagina.slug);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: pagina.nome,
      serviceType: pagina.nome,
      description: pagina.descricao,
      url,
      provider: {
        "@type": "LocalBusiness",
        name: EMPRESA.nome,
        url: EMPRESA.site,
        telephone: `+${EMPRESA.telefone}`,
        address: { "@type": "PostalAddress", addressLocality: EMPRESA.cidade, addressRegion: EMPRESA.uf, addressCountry: "BR" },
      },
      areaServed: AREAS.map((a) => ({ "@type": "City", name: a })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: `${EMPRESA.site}/` },
        { "@type": "ListItem", position: 2, name: pagina.nome, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: pagina.faq.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } })),
    },
  ];

  return (
    <div className={`${sora.variable} ${manrope.variable} font-manrope min-h-screen bg-verus-bg text-verus-text pb-16 md:pb-0`}>
      <Rastreio />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-30 bg-verus-bg/90 backdrop-blur border-b border-verus-line/60">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/site/logo.jpg" alt="" width={34} height={34} className="rounded" priority />
            <span className="font-sora text-lg font-bold tracking-tight">Verus</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-verus-muted">
            <Link href="/#aplicacoes" className="hover:text-verus-text">Aplicações</Link>
            <Link href="/#sistema" className="hover:text-verus-text">Sistema</Link>
            <Link href="/#metodo" className="hover:text-verus-text">Método</Link>
            <Link href="/#contato" className="hover:text-verus-text">Contato</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded border border-verus-line px-3 py-2 text-sm font-semibold text-verus-muted hover:text-verus-text hover:border-verus-muted transition-colors">
              <LogIn className="w-4 h-4" /> Entrar
            </Link>
            <WhatsAppCta texto="Orçamento no WhatsApp" mensagem={pagina.mensagem} className="hidden sm:inline-flex !py-2 !px-4 text-sm" />
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-16 md:pb-16 grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
          <div>
            <nav aria-label="Você está em" className="text-xs text-verus-muted">
              <Link href="/" className="hover:text-verus-text">Início</Link> <span aria-hidden>/</span> <span>{pagina.aplicacao}</span>
            </nav>
            <h1 className="font-sora text-4xl md:text-5xl font-extrabold leading-[1.08] tracking-tight mt-4">
              {pagina.nome} <span className="text-verus-green">em Maceió</span>
            </h1>
            <p className="mt-5 text-lg text-verus-muted max-w-xl">{pagina.intro}</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <WhatsAppCta texto="Pedir orçamento no WhatsApp" mensagem={pagina.mensagem} />
              <a href="#orcamento" className="inline-flex items-center justify-center gap-2 rounded border border-verus-line px-5 py-3 font-semibold hover:border-verus-muted transition-colors">
                Deixar os dados da obra <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-verus-muted">
              <li className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-verus-green shrink-0" /> Garantia em contrato</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-verus-green shrink-0" /> Teste de estanqueidade</li>
              <li className="flex items-center gap-2"><MapPin className="w-5 h-5 text-verus-green shrink-0" /> Maceió e {AREAS.length - 1} cidades de AL</li>
              <li className="flex items-center gap-2"><CalendarClock className="w-5 h-5 text-verus-green shrink-0" /> Visita técnica sem custo</li>
            </ul>
          </div>
          <Image
            src={pagina.imagem.src}
            alt={pagina.imagem.alt}
            width={pagina.imagem.largura}
            height={pagina.imagem.altura}
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="rounded-lg object-cover w-full h-72 md:h-[26rem] border border-verus-line"
          />
        </section>

        {/* Sinais */}
        <section className="bg-verus-bg2 border-y border-verus-line/60">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-16 grid md:grid-cols-[1fr_1.2fr] gap-8 items-start">
            <div>
              <Rotulo>Quando chamar</Rotulo>
              <Titulo className="mt-2">Sinais de que essa área precisa de atenção.</Titulo>
            </div>
            <div className="rounded-lg border border-verus-line bg-verus-card p-6">
              <p className="text-verus-text leading-relaxed">{pagina.sinais}</p>
              <p className="text-sm text-verus-muted mt-4">Na visita técnica, sem custo, a Verus identifica a causa antes de propor qualquer serviço.</p>
            </div>
          </div>
        </section>

        {/* Sistema e camadas */}
        <section className="mx-auto max-w-6xl px-4 py-14 md:py-20 grid lg:grid-cols-[1fr_1.2fr] gap-10">
          <div>
            <Rotulo>Como fazemos</Rotulo>
            <Titulo className="mt-2">Camada por camada, conferida antes da próxima.</Titulo>
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
            <p className="text-sm font-semibold text-verus-muted mb-3">
              {pagina.sistemas.length ? "Sistemas indicados para essa aplicação" : "Sistema"}
            </p>
            {pagina.sistemas.length ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {pagina.sistemas.map((nome) => (
                  <div key={nome} className="flex gap-3 rounded-lg border border-verus-line bg-verus-card/60 p-4">
                    <FileText className="w-5 h-5 text-verus-green shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">{nome}</h3>
                      <p className="text-sm text-verus-muted">{descricaoSistema(nome)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 rounded-lg border border-verus-line bg-verus-card/60 p-4">
                <FileText className="w-5 h-5 text-verus-green shrink-0 mt-0.5" />
                <p className="text-sm text-verus-muted">O sistema é escolhido pelo substrato e pelo uso da área, e vai descrito no memorial junto com o orçamento.</p>
              </div>
            )}
            <div className="mt-6 rounded-lg border border-verus-line bg-verus-card/40 p-5">
              <p className="font-sora font-semibold">O que você recebe ao final</p>
              <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-verus-muted">
                {ENTREGAVEIS.map((e) => (
                  <li key={e} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-verus-green shrink-0" /> {e}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Dúvidas */}
        <section className="bg-verus-bg2 border-y border-verus-line/60">
          <div className="mx-auto max-w-3xl px-4 py-14 md:py-16">
            <Rotulo>Dúvidas frequentes</Rotulo>
            <Titulo className="mt-2">Perguntas sobre {pagina.aplicacao.toLowerCase()}.</Titulo>
            <div className="mt-7"><Faq itens={pagina.faq} tema="escuro" /></div>
          </div>
        </section>

        {/* Orçamento */}
        <section id="orcamento" className="mx-auto max-w-6xl px-4 py-14 md:py-20 grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <Rotulo>Orçamento técnico</Rotulo>
            <Titulo className="mt-2">Vamos avaliar sua obra?</Titulo>
            <p className="text-verus-muted mt-3">Orçamento por m² depois da visita técnica, com o sistema indicado, prazo e garantia por escrito.</p>
            <div className="mt-7 space-y-3 text-sm">
              <p className="flex items-center gap-3"><Phone className="w-5 h-5 text-verus-green" /> WhatsApp {EMPRESA.telefoneFormatado}</p>
              <p className="flex items-center gap-3 text-verus-muted"><CalendarClock className="w-5 h-5 text-verus-green" /> {EMPRESA.horario}</p>
            </div>
            <div className="mt-8"><WhatsAppCta texto="Pedir orçamento no WhatsApp" mensagem={pagina.mensagem} /></div>
          </div>
          <div className="rounded-lg border border-verus-line bg-verus-card p-6">
            <p className="font-sora text-xl font-semibold">Deixe os dados da obra</p>
            <p className="text-sm text-verus-muted mt-1 mb-4">Um técnico responde no WhatsApp em até 1 dia útil.</p>
            <LeadForm tema="escuro" />
          </div>
        </section>

        {/* Outros serviços */}
        <section className="border-t border-verus-line/60">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <Rotulo>Outras aplicações</Rotulo>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
              {outras.map((o) => (
                <Link key={o.slug} href={`/impermeabilizacao/${o.slug}`} className="rounded-lg border border-verus-line bg-verus-card p-4 hover:border-verus-green/60 transition-colors">
                  <Layers className="w-5 h-5 text-verus-green" />
                  <p className="font-semibold mt-3 text-sm">{o.aplicacao}</p>
                  <p className="text-xs text-verus-green mt-2 inline-flex items-center gap-1">Ver serviço <ArrowRight className="w-3 h-3" /></p>
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm text-verus-muted">
              {pagina.nome} em {AREAS.join(", ")}.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-verus-line/60">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-verus-muted flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
          <div>
            <p className="font-sora font-semibold text-verus-text">{EMPRESA.nome}</p>
            <p className="mt-2">{EMPRESA.razao} · CNPJ {EMPRESA.cnpj}</p>
            <p>{EMPRESA.telefoneFormatado} · {EMPRESA.email}</p>
          </div>
          <div className="flex gap-5">
            <Link href="/" className="hover:text-verus-green">Início</Link>
            <Link href="/portal/login" className="hover:text-verus-green">Área do cliente</Link>
          </div>
        </div>
      </footer>

      <WhatsAppCta flutuante texto="WhatsApp" mensagem={pagina.mensagem} />
      <BarraMobile />
    </div>
  );
}
