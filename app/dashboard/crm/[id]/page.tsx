"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserPlus, FileText, MapPin, MessageCircle, Trash2, Save } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChatConversa } from "@/components/whatsapp/ChatConversa";
import { ETAPAS, ORIGENS, MOTIVOS_PERDA } from "@/lib/crm/leads";
import { formatCurrency, formatDateTime, formatPhone } from "@/lib/utils";

type Evento = { id: string; tipo: string; descricao: string; createdAt: string; user: { id: string; name: string } | null };
type Lead = {
  id: string; nome: string | null; telefone: string | null; email: string | null; cidade: string | null; bairro: string | null;
  tipoImovel: string | null; origem: string; descricao: string; urgencia: string; status: string; statusEm: string | null;
  motivoPerda: string | null; valorEstimado: number | null; valorFechado: number | null; responsavelId: string | null;
  proximaAcao: string | null; dataProximaAcao: string | null; utmSource: string | null; utmMedium: string | null;
  utmCampaign: string | null; utmTerm: string | null; utmContent: string | null; gclid: string | null; ctwaClid: string | null;
  adId: string | null; landingPage: string | null; createdAt: string;
  cliente: { id: string; nome: string } | null;
  responsavel: { id: string; name: string } | null;
  conversa: { id: string } | null;
  eventos: Evento[];
};

const TIPO_ICONE: Record<string, string> = {
  ETAPA: "🔀", NOTA: "📝", LIGACAO: "📞", WHATSAPP: "💬", EMAIL: "✉️", VISITA: "📍", ORCAMENTO: "📄", CONVERSAO: "🏁", SISTEMA: "⚙️",
};

export default function LeadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [nota, setNota] = useState("");
  const [tipoNota, setTipoNota] = useState("NOTA");
  const [form, setForm] = useState<Partial<Lead> | null>(null);

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ["lead", id],
    queryFn: async () => {
      const r = await fetch(`/api/leads/${id}`);
      if (!r.ok) throw new Error("Lead não encontrado");
      return r.json();
    },
    refetchInterval: 15000,
  });
  const { data: usuarios } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["usuarios"],
    queryFn: () => fetch("/api/usuarios").then((r) => r.json()),
  });

  const patch = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const r = await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json()).error ?? "Erro");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["lead", id] }); qc.invalidateQueries({ queryKey: ["crm-kanban"] }); },
    onError: (e) => alert(e instanceof Error ? e.message : "Erro"),
  });

  const addEvento = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/leads/${id}/eventos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: tipoNota, descricao: nota }) });
      if (!r.ok) throw new Error("Erro ao salvar nota");
    },
    onSuccess: () => { setNota(""); qc.invalidateQueries({ queryKey: ["lead", id] }); },
  });

  async function converter() {
    const r = await fetch(`/api/leads/${id}/converter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const d = await r.json();
    if (!r.ok) return alert(d.error ?? "Erro");
    qc.invalidateQueries({ queryKey: ["lead", id] });
    router.push(`/dashboard/clientes/${d.cliente.id}`);
  }

  async function excluir() {
    if (!confirm("Excluir este lead?")) return;
    const r = await fetch(`/api/leads/${id}`, { method: "DELETE" });
    if (r.ok) router.push("/dashboard/crm");
    else alert((await r.json()).error ?? "Erro");
  }

  function mudarEtapa(status: string) {
    if (status === "PERDIDO") {
      const motivo = prompt(`Motivo da perda (${MOTIVOS_PERDA.join(", ")}):`, "PRECO");
      if (!motivo) return;
      return patch.mutate({ status, motivoPerda: motivo.toUpperCase() });
    }
    if (status === "GANHO") {
      const v = prompt("Valor fechado (R$):", lead?.valorEstimado ? String(lead.valorEstimado) : "");
      return patch.mutate({ status, valorFechado: v ? Number(v.replace(",", ".")) : undefined });
    }
    patch.mutate({ status });
  }

  if (isLoading || !lead) return <p className="text-sm text-gray-500">Carregando…</p>;
  const f = form ?? lead;
  const etapa = ETAPAS.find((e) => e.value === lead.status);
  const set = (k: keyof Lead) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...(form ?? lead), [k]: e.target.value });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/crm" className="btn-ghost mt-1"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h2 className="font-display text-2xl font-bold text-brand-dark">
              {lead.nome ?? lead.cliente?.nome ?? (lead.telefone ? formatPhone(lead.telefone.replace(/^55/, "")) : "Lead sem nome")}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
              <Badge tone={(etapa?.tone ?? "neutral") as never}>{etapa?.label ?? lead.status}</Badge>
              <span className="badge-neutral">{ORIGENS[lead.origem] ?? lead.origem}</span>
              {lead.urgencia === "ALTA" && <span className="badge-red">Urgente</span>}
              <span>criado {formatDateTime(lead.createdAt)}</span>
              {lead.cliente && <Link className="text-brand underline" href={`/dashboard/clientes/${lead.cliente.id}`}>cliente: {lead.cliente.nome}</Link>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input-verus w-auto" value={lead.status} onChange={(e) => mudarEtapa(e.target.value)}>
            {ETAPAS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
          {!lead.cliente ? (
            <button className="btn-outline" onClick={converter}><UserPlus className="w-4 h-4" /> Virar cliente</button>
          ) : (
            <>
              <Link className="btn-outline" href={`/dashboard/visita/nova?clienteId=${lead.cliente.id}`}><MapPin className="w-4 h-4" /> Visita</Link>
              <Link className="btn-outline" href={`/dashboard/orcamento/novo?clienteId=${lead.cliente.id}`}><FileText className="w-4 h-4" /> Orçamento</Link>
            </>
          )}
          {lead.conversa ? (
            <Link className="btn-outline" href={`/dashboard/whatsapp?c=${lead.conversa.id}`}><MessageCircle className="w-4 h-4" /> Inbox</Link>
          ) : lead.telefone ? (
            <a className="btn-outline" href={`https://wa.me/${lead.telefone}`} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
          ) : null}
          <button className="btn-ghost text-red-600" onClick={excluir} title="Excluir"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Dados</CardTitle>
              {form && (
                <button className="btn-primary text-xs" onClick={() => { patch.mutate({ ...form, valorEstimado: form.valorEstimado === null || form.valorEstimado === undefined || (form.valorEstimado as unknown) === "" ? null : Number(form.valorEstimado), dataProximaAcao: form.dataProximaAcao ? new Date(form.dataProximaAcao).toISOString() : "", eventos: undefined, cliente: undefined, responsavel: undefined, conversa: undefined, status: undefined }); setForm(null); }}>
                  <Save className="w-3 h-3" /> Salvar
                </button>
              )}
            </CardHeader>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="col-span-2">Nome<input className="input-verus mt-1" value={f.nome ?? ""} onChange={set("nome")} /></label>
              <label>Telefone<input className="input-verus mt-1" value={f.telefone ?? ""} onChange={set("telefone")} /></label>
              <label>E-mail<input className="input-verus mt-1" value={f.email ?? ""} onChange={set("email")} /></label>
              <label>Cidade<input className="input-verus mt-1" value={f.cidade ?? ""} onChange={set("cidade")} /></label>
              <label>Bairro<input className="input-verus mt-1" value={f.bairro ?? ""} onChange={set("bairro")} /></label>
              <label>Tipo de imóvel
                <select className="input-verus mt-1" value={f.tipoImovel ?? ""} onChange={set("tipoImovel")}>
                  <option value="">—</option>
                  {["RESIDENCIAL", "CONDOMINIO", "COMERCIAL", "INDUSTRIA", "OBRA"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label>Urgência
                <select className="input-verus mt-1" value={f.urgencia} onChange={set("urgencia")}>
                  <option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option>
                </select>
              </label>
              <label>Valor estimado (R$)<input className="input-verus mt-1" type="number" step="0.01" value={f.valorEstimado ?? ""} onChange={set("valorEstimado")} /></label>
              <label>Responsável
                <select className="input-verus mt-1" value={f.responsavelId ?? ""} onChange={(e) => patch.mutate({ responsavelId: e.target.value || null })}>
                  <option value="">—</option>
                  {usuarios?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </label>
              <label>Próxima ação<input className="input-verus mt-1" value={f.proximaAcao ?? ""} onChange={set("proximaAcao")} placeholder="ligar, enviar proposta…" /></label>
              <label>Quando<input className="input-verus mt-1" type="datetime-local" value={f.dataProximaAcao ? new Date(f.dataProximaAcao).toISOString().slice(0, 16) : ""} onChange={set("dataProximaAcao")} /></label>
              <label className="col-span-2">Necessidade<textarea className="input-verus mt-1" rows={3} value={f.descricao} onChange={set("descricao")} /></label>
              {lead.status === "PERDIDO" && <p className="col-span-2 text-red-700">Motivo da perda: {lead.motivoPerda ?? "—"}</p>}
              {lead.valorFechado ? <p className="col-span-2 text-emerald-700">Fechado em {formatCurrency(lead.valorFechado)}</p> : null}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Rastreio de marketing</CardTitle></CardHeader>
            <dl className="text-xs text-gray-600 grid grid-cols-2 gap-x-3 gap-y-1">
              <dt>Origem</dt><dd>{ORIGENS[lead.origem] ?? lead.origem}</dd>
              <dt>utm_source / medium</dt><dd>{lead.utmSource ?? "—"} / {lead.utmMedium ?? "—"}</dd>
              <dt>Campanha</dt><dd>{lead.utmCampaign ?? "—"}</dd>
              <dt>Termo / conteúdo</dt><dd>{lead.utmTerm ?? "—"} / {lead.utmContent ?? "—"}</dd>
              <dt>gclid</dt><dd className="truncate" title={lead.gclid ?? ""}>{lead.gclid ?? "—"}</dd>
              <dt>ctwa_clid / anúncio</dt><dd className="truncate">{lead.ctwaClid ? "sim" : "—"} / {lead.adId ?? "—"}</dd>
              <dt>Landing</dt><dd className="truncate" title={lead.landingPage ?? ""}>{lead.landingPage ?? "—"}</dd>
            </dl>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-5">
          {lead.conversa && (
            <Card className="p-0 overflow-hidden">
              <ChatConversa conversaId={lead.conversa.id} altura="55vh" />
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Linha do tempo</CardTitle></CardHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (nota.trim()) addEvento.mutate(); }} className="flex gap-2 mb-4">
              <select className="input-verus w-auto" value={tipoNota} onChange={(e) => setTipoNota(e.target.value)}>
                <option value="NOTA">Nota</option><option value="LIGACAO">Ligação</option><option value="EMAIL">E-mail</option><option value="VISITA">Visita</option><option value="ORCAMENTO">Orçamento</option>
              </select>
              <input className="input-verus" placeholder="Registrar interação…" value={nota} onChange={(e) => setNota(e.target.value)} />
              <button className="btn-primary" disabled={!nota.trim() || addEvento.isPending}>Salvar</button>
            </form>
            <ul className="space-y-2">
              {lead.eventos.map((ev) => (
                <li key={ev.id} className="flex gap-2 text-sm">
                  <span className="w-5 text-center">{TIPO_ICONE[ev.tipo] ?? "•"}</span>
                  <div className="flex-1">
                    <p className="text-gray-800 whitespace-pre-wrap">{ev.descricao}</p>
                    <p className="text-[11px] text-gray-400">{formatDateTime(ev.createdAt)}{ev.user ? ` · ${ev.user.name}` : ""}</p>
                  </div>
                </li>
              ))}
              {lead.eventos.length === 0 && <li className="text-sm text-gray-500">Sem registros.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
