import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ClipboardList, CalendarDays, User as UserIcon } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { SwRegister } from "@/components/campo/SwRegister";
import { CampoSignOutButton } from "@/components/campo/CampoSignOutButton";

export const dynamic = "force-dynamic";

export default async function CampoLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <SwRegister />
      <header className="sticky top-0 z-30 bg-brand-dark text-white border-b border-brand-dark/40 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <Image
            src="/logo-square.png"
            alt="Verus"
            width={32}
            height={32}
            className="rounded-md bg-white/10"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/70 leading-none">Verus Campo</p>
            <p className="text-sm font-semibold truncate">{session.user.name}</p>
          </div>
          <CampoSignOutButton />
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-24">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto grid grid-cols-3">
          <Link
            href="/campo/obras"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-gray-600 hover:text-brand min-h-14"
          >
            <ClipboardList className="w-5 h-5" />
            Obras
          </Link>
          <Link
            href="/campo/hoje"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-gray-600 hover:text-brand min-h-14"
          >
            <CalendarDays className="w-5 h-5" />
            Hoje
          </Link>
          <Link
            href="/campo/perfil"
            className="flex flex-col items-center justify-center gap-1 py-3 text-xs text-gray-600 hover:text-brand min-h-14"
          >
            <UserIcon className="w-5 h-5" />
            Perfil
          </Link>
        </div>
      </nav>
    </div>
  );
}
