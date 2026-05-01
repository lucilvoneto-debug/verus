"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function CampoSignOutFull() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full inline-flex items-center justify-center gap-2 bg-danger hover:bg-red-600 text-white font-medium rounded-lg min-h-12 transition-colors"
    >
      <LogOut className="w-5 h-5" /> Sair
    </button>
  );
}
