"use client";

import { Bell, LogOut, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/clientes": "Clientes",
  "/dashboard/crm": "CRM & Funil",
  "/dashboard/atendimento": "Atendimentos",
  "/dashboard/visita": "Visitas técnicas",
  "/dashboard/orcamento": "Orçamentos",
  "/dashboard/servicos": "Serviços",
  "/dashboard/contratos": "Contratos",
  "/dashboard/obras": "Obras",
  "/dashboard/etapas": "Etapas",
  "/dashboard/equipes": "Equipes",
  "/dashboard/agenda": "Agenda",
  "/dashboard/estoque": "Estoque",
  "/dashboard/compras": "Compras",
  "/dashboard/fornecedores": "Fornecedores",
  "/dashboard/financeiro": "Financeiro",
  "/dashboard/medicoes": "Medições",
  "/dashboard/garantias": "Garantias",
  "/dashboard/pos-venda": "Pós-venda",
  "/dashboard/documentos": "Documentos",
  "/dashboard/relatorios": "Relatórios",
  "/dashboard/notificacoes": "Notificações",
  "/dashboard/usuarios": "Usuários",
  "/dashboard/configuracoes": "Configurações",
};

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const baseKey = Object.keys(titleMap)
    .filter((k) => pathname === k || pathname.startsWith(k + "/"))
    .sort((a, b) => b.length - a.length)[0];
  const title = titleMap[baseKey] ?? "Verus";
  const userName = session?.user?.name ?? "Usuário";

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 h-16 flex items-center gap-4">
      <h1 className="font-display text-xl font-semibold text-brand-dark">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 w-72">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            placeholder="Buscar..."
            className="bg-transparent outline-none text-sm flex-1 placeholder-gray-400"
          />
        </div>
        <button className="btn-ghost relative" aria-label="Notificações">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
        </button>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
          <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium hidden sm:inline">{userName}</span>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-ghost flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-dark"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
