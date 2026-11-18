import type { Metadata } from "next";

/**
 * Página de cliente aberta por link com token: nunca indexar nem seguir links.
 * A página em si é client component (não exporta metadata), por isso o noindex fica aqui.
 * Também há X-Robots-Tag no next.config.js e Disallow no robots.txt.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
