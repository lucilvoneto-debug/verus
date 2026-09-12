"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageCircle, Phone, Filter, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ETAPAS, ORIGENS, MOTIVOS_PERDA } from "@/lib/crm/leads";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { NovoLeadForm } from "@/components/crm/NovoLeadForm";

type LeadCard = {
  id: string;
  nome: string | null;
  telefone: string | null;
  origem: string;
  descricao: string;
  status: string;
  statusEm: string | null;
  urgencia: string;
  valorEstimado: number | null;
  valorFechado: number | null;
  createdAt: string;
  dataProximaAcao: string | null;
  proximaAcao: string | null;
  cliente: { id: string; nome: string } | null;
  responsavel: { id: string; name: string } | null;
  conversa: { id: string; naoLidas: number; ultimaMensagemEm: string | null } | null;
};

type Kanban = {
  colunas: { value: string; label: string; tone: string; leads: LeadCard[] }[];
  resumo: { origem: string; leads: number; ganhos: number; receita: number }[];
  dias: number;
};

function tempoDesde(iso: string | null): string {
  if (!iso) return "";
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return "agora";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d` : `${Math.floor(d / 30)}m`;
}

export default function CrmPage() {
  const qc = useQueryClient();
  const [responsavelId, setResponsavelId] = useState("");
  const [origem, setOrigem] = useState("");
  const [novo, setNovo] = useState(false);
  const [perda, setPerda] = useState<{ leadId: string; motivo: string } | null>(null);
  const [ganho, setGanho] = useState<{ leadId: string; valor: string } | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);

  const qs = new URLSearchParams();
  if (responsavelId) qs.set("responsavelId", responsavelId);
  if (origem) qs.set("origem", origem);

  const { data, isLoading } = useQuery<Kanban>({
    queryKey: ["crm-kanban", responsavelId, origem],
    queryFn: async () => {
      const r = await fetch(`/api/leads/kanban?${qs}`);
      if (!r.ok) throw new Error("Erro ao carregar funil");
      return r.json();
    },
    refetchInterval: 30000,
  });
  const { data: usuarios } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["usuarios"],
    queryFn: () => fetch("/api/usuarios").then((r) => r.json()),
  });

  const mover = useMutation({
    mutationFn: async (p: { id: string; status: string; motivoPerda?: string; valorFechado?: number }) => {
      const r = await fetch(`/api/leads/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erro");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crm-kanban"] }),
  });

  function soltar(status: string) {
    const id = arrastando;
    setArrastando(null);
    setSobre(null);
    if (!id) return;
    const atual = data?.colunas.flatMap((c) => c.leads).find((l) => l.id === id);
    if (!atual || atual.status === status) return;
    if (status === "PERDIDO") return setPerda({ leadId: id, motivo: "PRECO" });
    if (status === "GANHO") return setGanho({ leadId: id, valor: atual.valorEstimado ? String(atual.valorEstimado) : "" });
    mover.mutate({ id, status });
  }

  const totais = useMemo(() => {
    const abertos = data?.colunas.filter((c) => !["GANHO", "PERDIDO"].includes(c.value)).flatMap((c) => c.leads) ?? [];
    const ganhos = data?.colunas.find((c) => c.value === "GANHO")?.leads ?? [];
    const receita = ganhos.reduce((s, l) => s + (l.valorFechado ?? 0), 0);
    const pipeline = abertos.reduce((s, l) => s + (l.valorEstimado ?? 0), 0);
    return { abertos: abertos.length, ganhos: ganhos.length, receita, pipeline };
  }, [data]);

  useEffect(() => {
    // Esc cancela arrasto preso
    const h = (e: KeyboardEvent) => e.key === "Escape" && setArrastando(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">CRM & Funil</h2>
          <p className="text-sm text-gray-500">
            Leads de WhatsApp, Google, Meta Ads e site. Arraste o card pra mudar de etapa.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setNovo(true)}>
          <Plus className="w-4 h-4" /> Novo lead
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi border-brand"><p className="text-xs text-gray-500">Em aberto</p><p className="font-display text-2xl font-bold">{totais.abertos}</p></div>
        <div className="kpi border-amber-400"><p className="text-xs text-gray-500">Pipeline estimado</p><p className="font-display text-2xl font-bold">{formatCurrency(totais.pipeline)}</p></div>
        <div className="kpi border-emerald-500"><p className="text-xs text-gray-500">Ganhos ({data?.dias ?? 30}d)</p><p className="font-display text-2xl font-bold">{totais.ganhos}</p></div>
        <div className="kpi border-emerald-500"><p className="text-xs text-gray-500">Receita fechada ({data?.dias ?? 30}d)</p><p className="font-display text-2xl font-bold">{formatCurrency(totais.receita)}</p></div>
      </div>

      <Card className="py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="input-verus w-auto" value={responsavelId} onChange={(e) => setResponsavelId(e.target.value)}>
            <option value="">Todos os responsáveis</option>
            {usuarios?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select className="input-verus w-auto" value={origem} onChange={(e) => setOrigem(e.target.value)}>
            <option value="">Todas as origens</option>
            {Object.entries(ORIGENS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {data?.resumo?.length ? (
            <div className="ml-auto flex flex-wrap gap-2 text-xs">
              {data.resumo.map((r) => (
                <span key={r.origem} className="badge-neutral gap-1" title={`${r.ganhos} ganhos · ${formatCurrency(r.receita)}`}>
                  <TrendingUp className="w-3 h-3" /> {ORIGENS[r.origem] ?? r.origem}: {r.leads}
                  {r.ganhos > 0 && <span className="text-emerald-700"> · {r.ganhos}✓</span>}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Card>

      {isLoading ? (
        <p className="text-sm text-gray-500">Carregando funil…</p>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {data?.colunas.map((col) => (
              <div
                key={col.value}
                onDragOver={(e) => { e.preventDefault(); setSobre(col.value); }}
                onDragLeave={() => setSobre((s) => (s === col.value ? null : s))}
                onDrop={() => soltar(col.value)}
                className={`w-72 shrink-0 rounded-xl border p-2 transition-colors ${sobre === col.value ? "border-brand bg-brand-light/60" : "border-gray-200 bg-gray-50"}`}
              >
                <div className="flex items-center justify-between px-1 pb-2">
                  <span className="font-display font-semibold text-sm text-gray-800">{col.label}</span>
                  <Badge tone={col.tone as never}>{col.leads.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {col.leads.map((l) => (
                    <div
                      key={l.id}
                      draggable
                      onDragStart={() => setArrastando(l.id)}
                      onDragEnd={() => setArrastando(null)}
                      className={`card p-3 cursor-grab active:cursor-grabbing hover:border-brand ${arrastando === l.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/dashboard/crm/${l.id}`} className="font-medium text-sm text-gray-900 hover:text-brand line-clamp-1">
                          {l.nome ?? l.cliente?.nome ?? (l.telefone ? formatPhone(l.telefone.replace(/^55/, "")) : "Sem nome")}
                        </Link>
                        <span className="text-[11px] text-gray-400 shrink-0">{tempoDesde(l.statusEm ?? l.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{l.descricao}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="badge-neutral">{ORIGENS[l.origem] ?? l.origem}</span>
                        {l.urgencia === "ALTA" && <span className="badge-red">Urgente</span>}
                        {l.valorEstimado ? <span className="badge-blue">{formatCurrency(l.valorEstimado)}</span> : null}
                        {l.valorFechado ? <span className="badge-green">{formatCurrency(l.valorFechado)}</span> : null}
                        {l.conversa && (
                          <Link href={`/dashboard/whatsapp?c=${l.conversa.id}`} className="badge-green gap-1" title="Abrir conversa">
                            <MessageCircle className="w-3 h-3" />
                            {l.conversa.naoLidas > 0 ? l.conversa.naoLidas : ""}
                          </Link>
                        )}
                        {!l.conversa && l.telefone && (
                          <a href={`https://wa.me/${l.telefone}`} target="_blank" rel="noreferrer" className="badge-neutral gap-1"><Phone className="w-3 h-3" /></a>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
                        <span>{l.responsavel?.name ?? "sem responsável"}</span>
                        {l.dataProximaAcao && (
                          <span className={new Date(l.dataProximaAcao) < new Date() ? "text-red-600 font-medium" : ""}>
                            {l.proximaAcao ?? "ação"} · {new Date(l.dataProximaAcao).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={novo} onClose={() => setNovo(false)} title="Novo lead">
        <NovoLeadForm
          usuarios={usuarios ?? []}
          onDone={() => { setNovo(false); qc.invalidateQueries({ queryKey: ["crm-kanban"] }); }}
        />
      </Modal>

      <Modal open={!!perda} onClose={() => setPerda(null)} title="Motivo da perda">
        {perda && (
          <div className="space-y-4">
            <select className="input-verus" value={perda.motivo} onChange={(e) => setPerda({ ...perda, motivo: e.target.value })}>
              {MOTIVOS_PERDA.map((m) => <option key={m} value={m}>{m.replace(/_/g, " ").toLowerCase()}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setPerda(null)}>Cancelar</button>
              <button className="btn-primary" onClick={() => { mover.mutate({ id: perda.leadId, status: "PERDIDO", motivoPerda: perda.motivo }); setPerda(null); }}>Marcar perdido</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!ganho} onClose={() => setGanho(null)} title="Valor fechado">
        {ganho && (
          <div className="space-y-4">
            <input className="input-verus" type="number" min={0} step="0.01" placeholder="R$" value={ganho.valor} onChange={(e) => setGanho({ ...ganho, valor: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setGanho(null)}>Cancelar</button>
              <button className="btn-primary" onClick={() => { mover.mutate({ id: ganho.leadId, status: "GANHO", valorFechado: ganho.valor ? Number(ganho.valor) : undefined }); setGanho(null); }}>Marcar ganho</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
