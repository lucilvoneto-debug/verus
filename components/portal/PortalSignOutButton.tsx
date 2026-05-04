"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function PortalSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/portal/login" })}
      className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20"
      aria-label="Sair"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}
