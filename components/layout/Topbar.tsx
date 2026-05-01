"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, LogOut, Search, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  useMarcarLida,
  useMarcarTodasLidas,
  useNotificacoes,
} from "@/hooks/useNotificacoes";
import { formatDateTime } from "@/lib/utils";

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

type NotifItem = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  createdAt: string;
};

function NotificacoesPopover({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useNotificacoes({ naoLidas: "true", limit: "10" });
  const marcar = useMarcarLida();
  const marcarTodas = useMarcarTodasLidas();
  const itens: NotifItem[] = data?.data ?? [];

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="font-display font-semibold text-brand-dark">Notificações</div>
        {(data?.naoLidas ?? 0) > 0 && (
          <button
            onClick={() => marcarTodas.mutate()}
            disabled={marcarTodas.isPending}
            className="text-xs text-brand hover:underline flex items-center gap-1"
            title="Marcar todas como lidas"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {isLoading && (
          <div className="text-center text-gray-500 py-6 text-sm">Carregando...</div>
        )}
        {!isLoading && itens.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm">
            Nenhuma notificação não lida.
          </div>
        )}
        <ul className="divide-y divide-gray-100">
          {itens.map((n) => (
            <li key={n.id} className="p-3 hover:bg-gray-50">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-0.5">
                    {n.tipo} · {formatDateTime(n.createdAt)}
                  </div>
                  <div className="font-medium text-brand-dark text-sm truncate">
                    {n.titulo}
                  </div>
                  <p className="text-xs text-gray-700 line-clamp-2">{n.mensagem}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={onClose}
                      className="text-xs text-brand hover:underline mt-1 inline-block"
                    >
                      Abrir
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => marcar.mutate({ id: n.id, lida: true })}
                  className="p-1.5 rounded hover:bg-green-50 text-green-700 shrink-0"
                  title="Marcar como lida"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-100 p-2">
        <Link
          href="/dashboard/notificacoes"
          onClick={onClose}
          className="block text-center text-sm text-brand hover:underline py-1"
        >
          Ver todas
        </Link>
      </div>
    </div>
  );
}

function NotificacoesSino() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const enabled = !!session?.user;
  const { data } = useNotificacoes(
    enabled ? { naoLidas: "true", limit: "10" } : { lida: undefined, _disabled: "1" }
  );
  const naoLidas: number = enabled ? data?.naoLidas ?? 0 : 0;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="btn-ghost relative"
        aria-label="Notificações"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="w-5 h-5" />
        {naoLidas > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 text-[10px] font-semibold bg-danger text-white rounded-full flex items-center justify-center">
            {naoLidas > 99 ? "99+" : naoLidas}
          </span>
        )}
      </button>
      {open && enabled && <NotificacoesPopover onClose={() => setOpen(false)} />}
    </div>
  );
}

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
        <NotificacoesSino />
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
