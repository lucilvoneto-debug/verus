import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Home, Building2, FileText, LifeBuoy } from "lucide-react";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { PortalSignOutButton } from "@/components/portal/PortalSignOutButton";

export const dynamic = "force-dynamic";

export default async function PortalProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(clienteAuthOptions);
  if (!session?.user?.clienteId) redirect("/portal/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-brand-dark text-white border-b border-brand-dark/40 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
          <Image
            src="/logo-square.png"
            alt="Verus"
            width={32}
            height={32}
            className="rounded-md bg-white/10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/70 leading-none">Portal do Cliente</p>
            <p className="text-sm font-semibold truncate">
              {session.user.clienteNome ?? session.user.name}
            </p>
          </div>
          <PortalSignOutButton />
        </div>
        <nav className="hidden md:block border-t border-white/10">
          <div className="max-w-3xl mx-auto flex items-center gap-1 px-4">
            <DesktopLink href="/portal" label="Início" />
            <DesktopLink href="/portal/obras" label="Minhas obras" />
            <DesktopLink href="/portal/documentos" label="Documentos" />
            <DesktopLink href="/portal/suporte" label="Suporte" />
          </div>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-4 pb-24 md:pb-6">{children}</main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200">
        <div className="max-w-3xl mx-auto grid grid-cols-4">
          <MobileLink href="/portal" icon={<Home className="w-5 h-5" />} label="Início" />
          <MobileLink href="/portal/obras" icon={<Building2 className="w-5 h-5" />} label="Obras" />
          <MobileLink
            href="/portal/documentos"
            icon={<FileText className="w-5 h-5" />}
            label="Docs"
          />
          <MobileLink
            href="/portal/suporte"
            icon={<LifeBuoy className="w-5 h-5" />}
            label="Suporte"
          />
        </div>
      </nav>
    </div>
  );
}

function DesktopLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm text-white/80 hover:text-white border-b-2 border-transparent hover:border-white/40"
    >
      {label}
    </Link>
  );
}

function MobileLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-gray-600 hover:text-brand min-h-14"
    >
      {icon}
      {label}
    </Link>
  );
}
