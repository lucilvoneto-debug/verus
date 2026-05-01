"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function CampoSignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="p-2 rounded-lg hover:bg-white/10 min-h-10 min-w-10"
      aria-label="Sair"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
}
