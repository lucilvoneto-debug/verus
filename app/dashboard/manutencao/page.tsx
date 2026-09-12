"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Pause, Play, Plus, RefreshCw, Search, Trash2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";

type Plano = {
  id: string;
  periodicidadeMeses: number;
  proximaData: string;
  valor: number;
  status: "ATIVO" | "PAUSADO" | "CANCELADO";
  ultimaExecucao: string | null;
  ultimoAvisoEm: string | null;
  observacoes: string | null;
  cliente: { id: string; nome: string; whatsapp: string | null; telefone: string | null; cidade: string | null };
  obra: { id: string; numero: string; nome: string; dataConclusao: string | null };
};

function diasAte(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - hoje.getTime()) / 86400000);
}

function usePlanos(p: { status: string; q: string }) {
  const sp = new URLSearchParams();
  if (p.status) sp.set("status", p.status);
  if (p.q) sp.set("q", p.q);
  return useQuery<{ data: Plano[]; porStatus: Record<string, number> }>({
    queryKey: ["manutencao", p],
    queryFn: async () => {
      const r = await fetch(`/api/manutencao?${sp}`);
      if (!r.ok) throw new Error("Erro ao carregar planos");
      return r.json();
    },
  });
}

function useObrasConcluidas(q: string) {
  return useQuery<{ data: { id: string; numero: string; nome: string; status: string; cliente?: { nome: string } }[] }>({
    queryKey: ["obras-select-manutencao", q],
    queryFn: async () => {
      const sp = new URLSearchParams({ pageSize: "100" });
      if (q) sp.set("q", q);
      const r = await fetch(`/api/obras?${sp}`);
      if (!r.ok) throw new Error("Erro");
      return r.json();
    },
  });
}

function ModalNovo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const obras = useObrasConcluidas(busca);
  const [f, setF] = useState({ obraId: "", periodicidadeMeses: "12", proximaData: "", valor: "0", observacoes: "" });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setF({ obraId: "", periodicidadeMeses: "12", proximaData: "", valor: "0", observacoes: "" });
      setErro(null);
    }
  }, [open]);

  const criar = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/manutencao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, proximaData: f.proximaData || undefined }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manutencao"] });
      onClose();
    },
    onError: (e) => setErro(e.message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Novo plano de manutenção">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          criar.mutate();
        }}
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Obra</label>
          <input className="input-verus mb-1" placeholder="buscar obra…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select className="input-verus" value={f.obraId} onChange={(e) => setF({ ...f, obraId: e.target.value })} required>
            <option value="">Selecione…</option>
            {(obras.data?.data ?? []).map((o) => (
              <option key={o.id} value={o.id}>{o.numero} · {o.nome}{o.cliente ? ` — ${o.cliente.nome}` : ""} ({o.status})</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">O cliente vem da obra. A primeira data é conclusão + periodicidade, se não informar.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input label="A cada (meses)" type="number" min={1} max={60} value={f.periodicidadeMeses} onChange={(e) => setF({ ...f, periodicidadeMeses: e.target.value })} required />
          <Input label="Próxima data (opcional)" type="date" value={f.proximaData} onChange={(e) => setF({ ...f, proximaData: e.target.value })} />
          <Input label="Valor (R$)" type="number" step="0.01" min={0} value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
        </div>
        <textarea className="input-verus" rows={2} placeholder="Escopo da manutenção, observações…" value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} />
        {erro && <p className="text-xs text-danger">{erro}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={criar.isPending}>{criar.isPending ? "Salvando…" : "Criar plano"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ManutencaoPage() {
  return (
    <Suspense fallback={null}>
      <Manutencao />
    </Suspense>
  );
}

function Manutencao() {
  const qc = useQueryClient();
  const sp = useSearchParams();
  const destaque = sp.get("plano");
  const [status, setStatus] = useState("ATIVO");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const { data, isLoading } = usePlanos({ status, q });

  const acao = useMutation({
    mutationFn: async (input: { id: string; op: "executar" | "pausar" | "reativar" | "cancelar" | "excluir"; abrirAtendimento?: boolean }) => {
      let r: Response;
      if (input.op === "executar") {
        r = await fetch(`/api/manutencao/${input.id}/executar`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ abrirAtendimento: input.abrirAtendimento }) });
      } else if (input.op === "excluir") {
        r = await fetch(`/api/manutencao/${input.id}`, { method: "DELETE" });
      } else {
        const s = input.op === "pausar" ? "PAUSADO" : input.op === "reativar" ? "ATIVO" : "CANCELADO";
        r = await fetch(`/api/manutencao/${input.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
      }
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha");
      return d;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["manutencao"] });
      if (d?.atendimentoId) window.location.href = `/dashboard/atendimento/${d.atendimentoId}`;
    },
    onError: (e) => alert(e.message),
  });

  const planos = data?.data ?? [];
  const ativos = data?.porStatus?.ATIVO ?? 0;
  const atrasados = planos.filter((p) => p.status === "ATIVO" && diasAte(p.proximaData) < 0).length;
  const em30 = planos.filter((p) => p.status === "ATIVO" && diasAte(p.proximaData) >= 0 && diasAte(p.proximaData) <= 30).length;
  const receitaAno = planos.filter((p) => p.status === "ATIVO").reduce((acc, p) => acc + (p.valor * 12) / p.periodicidadeMeses, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Manutenção preventiva</h2>
          <p className="text-sm text-gray-500">Receita recorrente: revisão periódica das obras entregues. O cron avisa equipe e cliente 30 dias antes.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus className="w-4 h-4" /> Novo plano
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><p className="text-xs text-gray-500">Planos ativos</p><p className="font-display text-2xl font-bold text-brand-dark">{ativos}</p></Card>
        <Card><p className="text-xs text-gray-500">Atrasados</p><p className="font-display text-2xl font-bold text-danger">{atrasados}</p></Card>
        <Card><p className="text-xs text-gray-500">Próximos 30 dias</p><p className="font-display text-2xl font-bold text-warning">{em30}</p></Card>
        <Card><p className="text-xs text-gray-500">Receita prevista/ano</p><p className="font-display text-2xl font-bold text-success">{formatCurrency(receitaAno)}</p></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input placeholder="Buscar por cliente ou obra…" value={q} onChange={(e) => setQ(e.target.value)} className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <select className="input-verus" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ATIVO">Ativos</option>
            <option value="PAUSADO">Pausados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Cliente / Obra</th>
                <th>Próxima</th>
                <th>Periodicidade</th>
                <th>Valor</th>
                <th>Última</th>
                <th>Aviso</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center text-gray-500 py-8">Carregando...</td></tr>}
              {!isLoading && planos.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-500 py-10"><RefreshCw className="w-6 h-6 mx-auto mb-2 text-gray-300" />Nenhum plano. Toda obra entregue merece um.</td></tr>
              )}
              {planos.map((p) => {
                const dias = diasAte(p.proximaData);
                const tel = p.cliente.whatsapp || p.cliente.telefone;
                return (
                  <tr key={p.id} className={p.id === destaque ? "bg-brand-light/40" : ""}>
                    <td>
                      <Link href={`/dashboard/clientes/${p.cliente.id}`} className="font-medium text-brand-dark hover:underline">{p.cliente.nome}</Link>
                      <div className="text-xs text-gray-500">
                        <Link href={`/dashboard/obras/${p.obra.id}`} className="hover:underline">{p.obra.numero} · {p.obra.nome}</Link>
                        {tel && <> · {formatPhone(tel)}</>}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm tabular-nums">{formatDate(p.proximaData)}</div>
                      {p.status === "ATIVO" && (
                        <div className={`text-xs ${dias < 0 ? "text-danger" : dias <= 30 ? "text-warning" : "text-gray-500"}`}>
                          {dias < 0 ? `${-dias} dia(s) atrasado` : dias === 0 ? "hoje" : `em ${dias} dia(s)`}
                        </div>
                      )}
                    </td>
                    <td className="text-sm">{p.periodicidadeMeses} meses</td>
                    <td className="text-sm tabular-nums">{formatCurrency(p.valor)}</td>
                    <td className="text-sm">{p.ultimaExecucao ? formatDate(p.ultimaExecucao) : <span className="text-gray-400">nunca</span>}</td>
                    <td className="text-sm">{p.ultimoAvisoEm ? formatDate(p.ultimoAvisoEm) : <span className="text-gray-400">—</span>}</td>
                    <td><Badge tone={p.status === "ATIVO" ? "green" : p.status === "PAUSADO" ? "yellow" : "neutral"}>{p.status}</Badge></td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        {p.status === "ATIVO" && (
                          <>
                            <button
                              className="p-2 rounded hover:bg-green-50 text-green-700"
                              title="Marcar como feita (abre atendimento para agendar)"
                              onClick={() => {
                                const abrir = confirm("Marcar manutenção como feita e reagendar a próxima?\n\nOK = também abre um atendimento para agendar a visita.\nCancelar = só reagenda.");
                                acao.mutate({ id: p.id, op: "executar", abrirAtendimento: abrir });
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Pausar" onClick={() => acao.mutate({ id: p.id, op: "pausar" })}>
                              <Pause className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {p.status === "PAUSADO" && (
                          <button className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Reativar" onClick={() => acao.mutate({ id: p.id, op: "reativar" })}>
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {p.status !== "CANCELADO" && (
                          <button className="p-2 rounded hover:bg-red-50 text-red-600" title="Cancelar plano" onClick={() => confirm("Cancelar este plano?") && acao.mutate({ id: p.id, op: "cancelar" })}>
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {p.status === "CANCELADO" && (
                          <button className="p-2 rounded hover:bg-red-50 text-red-600" title="Excluir" onClick={() => confirm("Excluir definitivamente?") && acao.mutate({ id: p.id, op: "excluir" })}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ModalNovo open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
