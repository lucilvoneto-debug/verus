"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Search, Settings, MessageCircle, Archive, UserCircle2 } from "lucide-react";
import { ChatConversa } from "@/components/whatsapp/ChatConversa";
import { ETAPAS, ORIGENS } from "@/lib/crm/leads";
import { formatPhone } from "@/lib/utils";

type ConversaItem = {
  id: string;
  telefone: string;
  nome: string | null;
  naoLidas: number;
  ultimaMensagem: string | null;
  ultimaMensagemEm: string | null;
  responsavelId: string | null;
  linha: { id: string; rotulo: string | null; numeroExibicao: string | null } | null;
  lead: { id: string; status: string; origem: string; nome: string | null } | null;
};

function tempo(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function Inbox() {
  const sp = useSearchParams();
  const router = useRouter();
  const ativa = sp.get("c");
  const [q, setQ] = useState("");
  const [soNaoLidas, setSoNaoLidas] = useState(false);
  const [arquivadas, setArquivadas] = useState(false);
  const [dono, setDono] = useState<"" | "minhas" | "ninguem">("");
  const { data: session } = useSession();

  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (soNaoLidas) qs.set("somenteNaoLidas", "1");
  if (arquivadas) qs.set("arquivadas", "1");
  if (dono === "minhas" && session?.user?.id) qs.set("responsavelId", session.user.id);
  if (dono === "ninguem") qs.set("responsavelId", "ninguem");

  const usuarios = useQuery<{ id: string; name: string }[]>({
    queryKey: ["usuarios"],
    queryFn: () => fetch("/api/usuarios").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });
  const nomeDe = (id: string | null) => (id ? usuarios.data?.find((u) => u.id === id)?.name?.split(" ")[0] ?? null : null);

  const { data, isLoading } = useQuery<{ data: ConversaItem[]; total: number }>({
    queryKey: ["conversas", q, soNaoLidas, arquivadas, dono, session?.user?.id],
    queryFn: async () => {
      const r = await fetch(`/api/whatsapp/conversas?${qs}`);
      if (!r.ok) throw new Error("Erro ao carregar conversas");
      return r.json();
    },
    refetchInterval: 10000,
  });

  const conversaAtiva = data?.data.find((c) => c.id === ativa);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">WhatsApp</h2>
          <p className="text-sm text-gray-500">Caixa de entrada da API oficial. O que a equipe responde pelo celular também aparece aqui.</p>
        </div>
        <Link href="/dashboard/configuracoes/whatsapp" className="btn-outline"><Settings className="w-4 h-4" /> Conexão</Link>
      </div>

      <div className="card p-0 overflow-hidden grid grid-cols-1 md:grid-cols-[320px_1fr]" style={{ height: "calc(100vh - 200px)" }}>
        <aside className="border-r border-gray-200 flex flex-col min-h-0">
          <div className="p-2 border-b border-gray-200 space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-200">
              <Search className="w-4 h-4 text-gray-400" />
              <input className="bg-transparent outline-none text-sm flex-1" placeholder="Buscar nome, telefone…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="flex gap-2 text-xs">
              <button className={`px-2 py-1 rounded-full border ${soNaoLidas ? "bg-brand text-white border-brand" : "border-gray-300"}`} onClick={() => setSoNaoLidas((v) => !v)}>Não lidas</button>
              <button className={`px-2 py-1 rounded-full border flex items-center gap-1 ${arquivadas ? "bg-brand text-white border-brand" : "border-gray-300"}`} onClick={() => setArquivadas((v) => !v)}><Archive className="w-3 h-3" /> Arquivadas</button>
            </div>
            <div className="flex gap-2 text-xs">
              <button className={`px-2 py-1 rounded-full border ${dono === "minhas" ? "bg-brand text-white border-brand" : "border-gray-300"}`} onClick={() => setDono((v) => (v === "minhas" ? "" : "minhas"))}>Minhas</button>
              <button className={`px-2 py-1 rounded-full border ${dono === "ninguem" ? "bg-brand text-white border-brand" : "border-gray-300"}`} onClick={() => setDono((v) => (v === "ninguem" ? "" : "ninguem"))}>Sem dono</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading && <p className="p-3 text-sm text-gray-500">Carregando…</p>}
            {data?.data.length === 0 && <p className="p-3 text-sm text-gray-500">Nenhuma conversa.</p>}
            {data?.data.map((c) => {
              const etapa = ETAPAS.find((e) => e.value === c.lead?.status);
              return (
                <button
                  key={c.id}
                  onClick={() => router.replace(`/dashboard/whatsapp?c=${c.id}`)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 ${ativa === c.id ? "bg-brand-light/70" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${c.naoLidas ? "font-semibold text-gray-900" : "text-gray-800"}`}>
                      {c.nome ?? c.lead?.nome ?? formatPhone(c.telefone.replace(/^55/, ""))}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0">{tempo(c.ultimaMensagemEm)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 truncate">{c.ultimaMensagem ?? "—"}</span>
                    {c.naoLidas > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center">{c.naoLidas}</span>}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {c.lead && <span className={`badge-${etapa?.tone ?? "neutral"} !py-0`}>{etapa?.label ?? c.lead.status}</span>}
                    {c.lead && <span className="badge-neutral !py-0">{ORIGENS[c.lead.origem] ?? c.lead.origem}</span>}
                    {c.linha?.rotulo && <span className="badge-neutral !py-0">{c.linha.rotulo}</span>}
                    {nomeDe(c.responsavelId) && <span className="badge-neutral !py-0 flex items-center gap-0.5"><UserCircle2 className="w-3 h-3" />{nomeDe(c.responsavelId)}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-h-0 flex flex-col">
          {ativa ? (
            <>
              {conversaAtiva?.lead && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs">
                  <span className="text-gray-500">Lead:</span>
                  <Link href={`/dashboard/crm/${conversaAtiva.lead.id}`} className="text-brand underline">{ETAPAS.find((e) => e.value === conversaAtiva.lead?.status)?.label ?? conversaAtiva.lead.status} · abrir no CRM</Link>
                </div>
              )}
              <ChatConversa conversaId={ativa} altura="100%" />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <MessageCircle className="w-10 h-10" />
              <p className="text-sm">Escolha uma conversa</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Carregando…</p>}>
      <Inbox />
    </Suspense>
  );
}
