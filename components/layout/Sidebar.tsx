"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Headset, MapPin, FileText, Wrench,
  ScrollText, Hammer, ListChecks, HardHat, Calendar, Boxes, ShoppingCart,
  Truck, Wallet, Ruler, ShieldCheck, Smile, FolderOpen, BarChart3, Bell,
  UserCog, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: "Geral",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Comercial",
    items: [
      { label: "Clientes", href: "/dashboard/clientes", icon: Users },
      { label: "CRM & Funil", href: "/dashboard/crm", icon: BarChart3 },
      { label: "Atendimentos", href: "/dashboard/atendimento", icon: Headset },
      { label: "Visitas", href: "/dashboard/visita", icon: MapPin },
      { label: "Orçamentos", href: "/dashboard/orcamento", icon: FileText },
      { label: "Serviços", href: "/dashboard/servicos", icon: Wrench },
      { label: "Contratos", href: "/dashboard/contratos", icon: ScrollText },
    ],
  },
  {
    label: "Operacional",
    items: [
      { label: "Obras", href: "/dashboard/obras", icon: Hammer },
      { label: "Etapas", href: "/dashboard/etapas", icon: ListChecks },
      { label: "Equipes", href: "/dashboard/equipes", icon: HardHat },
      { label: "Agenda", href: "/dashboard/agenda", icon: Calendar },
      { label: "Medições", href: "/dashboard/medicoes", icon: Ruler },
    ],
  },
  {
    label: "Suprimentos",
    items: [
      { label: "Estoque", href: "/dashboard/estoque", icon: Boxes },
      { label: "Compras", href: "/dashboard/compras", icon: ShoppingCart },
      { label: "Fornecedores", href: "/dashboard/fornecedores", icon: Truck },
    ],
  },
  {
    label: "Financeiro",
    items: [{ label: "Financeiro", href: "/dashboard/financeiro", icon: Wallet }],
  },
  {
    label: "Pós-venda",
    items: [
      { label: "Garantias", href: "/dashboard/garantias", icon: ShieldCheck },
      { label: "Pós-venda", href: "/dashboard/pos-venda", icon: Smile },
      { label: "Documentos", href: "/dashboard/documentos", icon: FolderOpen },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3 },
      { label: "Notificações", href: "/dashboard/notificacoes", icon: Bell },
      { label: "Usuários", href: "/dashboard/usuarios", icon: UserCog },
      { label: "Configurações", href: "/dashboard/configuracoes", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "shrink-0 bg-brand-dark text-white flex flex-col h-screen sticky top-0 transition-all duration-200 scrollbar-verus",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Verus" className="w-7 h-7 object-contain" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-display text-xl font-bold">Verus</div>
            <div className="text-[10px] uppercase tracking-wider text-white/60">ERP</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto p-1 rounded hover:bg-white/10"
          aria-label="Recolher menu"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map((g) => (
          <div key={g.label} className="mb-3">
            {!collapsed && (
              <div className="px-4 text-[10px] uppercase tracking-wider text-white/40 mb-1">
                {g.label}
              </div>
            )}
            <ul>
              {g.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                        active
                          ? "bg-brand text-white border-l-2 border-white"
                          : "text-white/80 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10 text-[11px] text-white/50">
          v0.1.0 · Verus ERP
        </div>
      )}
    </aside>
  );
}
