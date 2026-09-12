"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudRain, Pencil, Play, Plus, Power, Trash2, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { MSG_CLIMA_PADRAO } from "@/lib/validations/gatilho-clima";
import { formatDateTime } from "@/lib/utils";

type Gatilho = {
  id: string;
  cidade: string;
  lat: number;
  lng: number;
  ativo: boolean;
  limiarChuvaMm: number;
  cooldownDias: number;
  mensagem: string;
  ultimoDisparoEm: string | null;
  disparos: number;
  clientesNaCidade: number;
  clima: { ontem: number; hoje: number } | null;
};

type Disparo = {
  id: string;
  chuvaMm: number;
  mensagem: string;
  status: string;
  createdAt: string;
  cliente: { id: string; nome: string; cidade: string | null };
};

type Form = { cidade: string; lat: string; lng: string; limiarChuvaMm: string; cooldownDias: string; mensagem: string; ativo: boolean };
const vazio: Form = { cidade: "", lat: "", lng: "", limiarChuvaMm: "10", cooldownDias: "15", mensagem: MSG_CLIMA_PADRAO, ativo: true };

export default function GatilhoClimaPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ data: Gatilho[] }>({
    queryKey: ["gatilhos-clima"],
    queryFn: async () => {
      const r = await fetch("/api/gatilho-clima?clima=1");
      if (!r.ok) throw new Error("Erro");
      return r.json();
    },
  });
  const disparos = useQuery<{ data: Disparo[] }>({
    queryKey: ["disparos-clima"],
    queryFn: async () => {
      const r = await fetch("/api/gatilho-clima/disparos");
      if (!r.ok) throw new Error("Erro");
      return r.json();
    },
  });

  const [modal, setModal] = useState<null | { modo: "novo" } | { modo: "editar"; g: Gatilho }>(null);
  const [form, setForm] = useState<Form>(vazio);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  useEffect(() => {
    if (!modal) return;
    setErro(null);
    if (modal.modo === "novo") setForm(vazio);
    else {
      const g = modal.g;
      setForm({ cidade: g.cidade, lat: String(g.lat), lng: String(g.lng), limiarChuvaMm: String(g.limiarChuvaMm), cooldownDias: String(g.cooldownDias), mensagem: g.mensagem, ativo: g.ativo });
    }
  }, [modal]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!modal) return;
      const body = {
        cidade: form.cidade,
        ...(form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : {}),
        limiarChuvaMm: Number(form.limiarChuvaMm),
        cooldownDias: Number(form.cooldownDias),
        mensagem: form.mensagem,
        ativo: form.ativo,
      };
      const r = await fetch(modal.modo === "novo" ? "/api/gatilho-clima" : `/api/gatilho-clima/${modal.g.id}`, {
        method: modal.modo === "novo" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gatilhos-clima"] });
      setModal(null);
    },
    onError: (e) => setErro(e.message),
  });

  const alternar = useMutation({
    mutationFn: async (g: Gatilho) => {
      const r = await fetch(`/api/gatilho-clima/${g.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ativo: !g.ativo }) });
      if (!r.ok) throw new Error("Falha");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gatilhos-clima"] }),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/gatilho-clima/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Falha");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gatilhos-clima"] });
      qc.invalidateQueries({ queryKey: ["disparos-clima"] });
    },
  });

  const rodar = useMutation({
    mutationFn: async (input: { gatilhoId?: string; forcar?: boolean }) => {
      const r = await fetch("/api/gatilho-clima/rodar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha");
      return d as { gatilhos: { cidade: string; chuvaMm: number; disparou: boolean; enviados: number; falhas: number; motivo?: string }[] };
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["gatilhos-clima"] });
      qc.invalidateQueries({ queryKey: ["disparos-clima"] });
      setResultado(
        d.gatilhos.length === 0
          ? "Nenhum gatilho ativo."
          : d.gatilhos.map((g) => `${g.cidade}: ${g.chuvaMm.toFixed(1)} mm — ${g.disparou ? `disparou (${g.enviados} enviados, ${g.falhas} falhas)` : `não disparou (${g.motivo})`}`).join("\n"),
      );
    },
    onError: (e) => setResultado(`Erro: ${e.message}`),
  });

  const gatilhos = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Gatilho de chuva</h2>
          <p className="text-sm text-gray-500">
            Choveu acima do limiar na cidade → o ERP manda WhatsApp para a carteira de clientes de lá. Roda todo dia no cron; aqui você testa na hora.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => rodar.mutate({})} disabled={rodar.isPending}>
            <Play className="w-4 h-4" /> {rodar.isPending ? "Verificando…" : "Verificar agora"}
          </button>
          <button className="btn-primary" onClick={() => setModal({ modo: "novo" })}>
            <Plus className="w-4 h-4" /> Nova cidade
          </button>
        </div>
      </div>

      {resultado && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm whitespace-pre-wrap font-mono text-gray-700">{resultado}</div>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Cidade</th>
                <th>Chuva ontem / hoje</th>
                <th>Limiar</th>
                <th>Cooldown</th>
                <th>Clientes</th>
                <th>Último disparo</th>
                <th>Envios</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="text-center text-gray-500 py-8">Carregando (consulta o clima de cada cidade)…</td></tr>}
              {!isLoading && gatilhos.length === 0 && (
                <tr><td colSpan={9} className="text-center text-gray-500 py-10"><CloudRain className="w-6 h-6 mx-auto mb-2 text-gray-300" />Nenhuma cidade configurada.</td></tr>
              )}
              {gatilhos.map((g) => {
                const acima = g.clima && Math.max(g.clima.ontem, g.clima.hoje) >= g.limiarChuvaMm;
                return (
                  <tr key={g.id} className={g.ativo ? "" : "opacity-60"}>
                    <td>
                      <div className="font-medium">{g.cidade}</div>
                      <div className="text-xs text-gray-400 tabular-nums">{g.lat.toFixed(3)}, {g.lng.toFixed(3)}</div>
                    </td>
                    <td className="text-sm tabular-nums">
                      {g.clima ? (
                        <span className={acima ? "text-brand font-semibold" : ""}>{g.clima.ontem.toFixed(1)} / {g.clima.hoje.toFixed(1)} mm</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="text-sm tabular-nums">{g.limiarChuvaMm} mm</td>
                    <td className="text-sm">{g.cooldownDias} dias</td>
                    <td className="text-sm tabular-nums">{g.clientesNaCidade}</td>
                    <td className="text-sm">{g.ultimoDisparoEm ? formatDateTime(g.ultimoDisparoEm) : <span className="text-gray-400">nunca</span>}</td>
                    <td className="text-sm tabular-nums">{g.disparos}</td>
                    <td><Badge tone={g.ativo ? "green" : "neutral"}>{g.ativo ? "Ativo" : "Pausado"}</Badge></td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <button
                          className="p-2 rounded hover:bg-amber-50 text-amber-600"
                          title="Disparar agora, ignorando limiar e cooldown"
                          onClick={() => confirm(`Disparar AGORA para ${g.clientesNaCidade} cliente(s) de ${g.cidade}, ignorando limiar e cooldown?`) && rodar.mutate({ gatilhoId: g.id, forcar: true })}
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Editar" onClick={() => setModal({ modo: "editar", g })}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded hover:bg-gray-100 text-gray-600" title={g.ativo ? "Pausar" : "Ativar"} onClick={() => alternar.mutate(g)}>
                          <Power className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded hover:bg-red-50 text-red-600" title="Excluir" onClick={() => confirm(`Excluir gatilho de ${g.cidade} e seu histórico?`) && excluir.mutate(g.id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-0">
        <div className="px-5 py-3 border-b border-gray-100 font-display font-semibold text-brand-dark">Últimos envios</div>
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Cliente</th>
                <th>Chuva</th>
                <th>Mensagem</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(disparos.data?.data ?? []).length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-6">Nenhum envio ainda.</td></tr>}
              {(disparos.data?.data ?? []).map((d) => (
                <tr key={d.id}>
                  <td className="text-sm">{formatDateTime(d.createdAt)}</td>
                  <td className="text-sm">{d.cliente.nome}<span className="text-xs text-gray-400"> · {d.cliente.cidade}</span></td>
                  <td className="text-sm tabular-nums">{d.chuvaMm.toFixed(1)} mm</td>
                  <td className="text-xs text-gray-600 max-w-[28rem]"><p className="line-clamp-2">{d.mensagem}</p></td>
                  <td><Badge tone={d.status === "ENVIADO" ? "green" : "red"}>{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.modo === "novo" ? "Nova cidade" : "Editar gatilho"}>
        {modal && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              salvar.mutate();
            }}
          >
            <Input label="Cidade (igual ao cadastro dos clientes)" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} required placeholder="Maceió" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitude (opcional)" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="auto pela cidade" />
              <Input label="Longitude (opcional)" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="auto pela cidade" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Limiar de chuva (mm/dia)" type="number" min={1} step="0.5" value={form.limiarChuvaMm} onChange={(e) => setForm({ ...form, limiarChuvaMm: e.target.value })} required />
              <Input label="Cooldown (dias)" type="number" min={1} value={form.cooldownDias} onChange={(e) => setForm({ ...form, cooldownDias: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea className="input-verus" rows={4} value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })} required />
              <p className="text-xs text-gray-500 mt-1">Variáveis: <code>{"{nome}"}</code> primeiro nome, <code>{"{cidade}"}</code>, <code>{"{chuva}"}</code> mm.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Ativo</label>
            {erro && <p className="text-xs text-danger">{erro}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={salvar.isPending}>{salvar.isPending ? "Salvando…" : "Salvar"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
