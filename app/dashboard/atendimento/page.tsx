"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Eye, Headset, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { UploadFoto } from "@/components/ui/UploadFoto";
import { useAtendimentos, useCreateAtendimento } from "@/hooks/useAtendimentos";
import { useClientesSelect } from "@/hooks/useVisitas";
import {
  CANAIS_ATENDIMENTO,
  CANAL_LABEL,
  STATUS_ATENDIMENTO,
  STATUS_ATEND_LABEL,
  URGENCIAS,
} from "@/lib/validations/atendimento";
import { formatDateTime, formatPhone } from "@/lib/utils";
import { atendimentoStatusTone as statusTone, urgenciaTone } from "@/lib/status";

function useUsuarios() {
  return useQuery<{ id: string; name: string }[]>({
    queryKey: ["usuarios"],
    queryFn: () => fetch("/api/usuarios").then((r) => r.json()),
  });
}

function ModalNovo({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const create = useCreateAtendimento();
  const usuarios = useUsuarios();
  const [buscaCliente, setBuscaCliente] = useState("");
  const clientes = useClientesSelect(buscaCliente);
  const [f, setF] = useState({ clienteId: "", canal: "WHATSAPP", urgencia: "MEDIA", descricao: "", responsavelId: "", fotos: [] as string[] });
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setF({ clienteId: "", canal: "WHATSAPP", urgencia: "MEDIA", descricao: "", responsavelId: session?.user?.id ?? "", fotos: [] });
      setErro(null);
      setBuscaCliente("");
    }
  }, [open, session?.user?.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await create.mutateAsync({
        clienteId: f.clienteId,
        canal: f.canal as (typeof CANAIS_ATENDIMENTO)[number],
        urgencia: f.urgencia as (typeof URGENCIAS)[number],
        descricao: f.descricao,
        responsavelId: f.responsavelId,
        status: "ABERTO",
        fotos: f.fotos,
      });
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo atendimento">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <input className="input-verus mb-1" placeholder="buscar cliente…" value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} />
          <select className="input-verus" value={f.clienteId} onChange={(e) => setF({ ...f, clienteId: e.target.value })} required>
            <option value="">Selecione…</option>
            {(clientes.data?.data ?? []).map((c: { id: string; nome: string; cidade: string | null }) => (
              <option key={c.id} value={c.id}>{c.nome}{c.cidade ? ` · ${c.cidade}` : ""}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Cliente novo? <Link href="/dashboard/clientes/novo" className="text-brand hover:underline">Cadastre primeiro</Link>. Contato que ainda não é cliente vai no <Link href="/dashboard/crm" className="text-brand hover:underline">CRM</Link>.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
            <select className="input-verus" value={f.canal} onChange={(e) => setF({ ...f, canal: e.target.value })}>
              {CANAIS_ATENDIMENTO.map((c) => <option key={c} value={c}>{CANAL_LABEL[c]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgência</label>
            <select className="input-verus" value={f.urgencia} onChange={(e) => setF({ ...f, urgencia: e.target.value })}>
              {URGENCIAS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
            <select className="input-verus" value={f.responsavelId} onChange={(e) => setF({ ...f, responsavelId: e.target.value })} required>
              <option value="">Selecione…</option>
              {(usuarios.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">O que o cliente relatou</label>
          <textarea className="input-verus" rows={4} required value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Infiltração na laje do 3º andar após chuva, mancha no teto do quarto…" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fotos enviadas pelo cliente</label>
          <UploadFoto contexto="atendimento" onUpload={(a) => setF((v) => ({ ...v, fotos: [...v.fotos, a.url] }))} />
          {f.fotos.length > 0 && (
            <ul className="flex flex-wrap gap-2 mt-2">
              {f.fotos.map((u, i) => (
                <li key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                  <button type="button" className="absolute -top-1 -right-1 bg-black/70 text-white rounded-full w-5 h-5 text-xs" onClick={() => setF((v) => ({ ...v, fotos: v.fotos.filter((_, j) => j !== i) }))}>×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {erro && <p className="text-xs text-danger">{erro}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={create.isPending}>{create.isPending ? "Salvando…" : "Registrar"}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AtendimentosPage() {
  const { data: session } = useSession();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [canal, setCanal] = useState("");
  const [urgencia, setUrgencia] = useState("");
  const [soMeus, setSoMeus] = useState(false);
  const [abertos, setAbertos] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);

  const { data, isLoading } = useAtendimentos({
    q, status, canal, urgencia,
    responsavelId: soMeus ? session?.user?.id : undefined,
    abertos: abertos && !status ? "1" : undefined,
    page, pageSize: 25,
  });

  const porStatus = data?.porStatus ?? {};
  const totalAbertos = (porStatus.ABERTO ?? 0) + (porStatus.EM_ANDAMENTO ?? 0) + (porStatus.AGUARDANDO_CLIENTE ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Atendimentos</h2>
          <p className="text-sm text-gray-500">Chamados de clientes por canal — WhatsApp, telefone, site, portal.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus className="w-4 h-4" /> Novo atendimento
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><p className="text-xs text-gray-500">Em aberto</p><p className="font-display text-2xl font-bold text-brand">{totalAbertos}</p></Card>
        <Card><p className="text-xs text-gray-500">Aguardando cliente</p><p className="font-display text-2xl font-bold text-brand-dark">{porStatus.AGUARDANDO_CLIENTE ?? 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Em andamento</p><p className="font-display text-2xl font-bold text-warning">{porStatus.EM_ANDAMENTO ?? 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Resolvidos</p><p className="font-display text-2xl font-bold text-success">{porStatus.RESOLVIDO ?? 0}</p></Card>
        <Card><p className="text-xs text-gray-500">Cancelados</p><p className="font-display text-2xl font-bold text-gray-400">{porStatus.CANCELADO ?? 0}</p></Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input placeholder="Buscar por cliente ou descrição…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <select className="input-verus" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">{abertos ? "Só em aberto" : "Todos os status"}</option>
            {STATUS_ATENDIMENTO.map((s) => <option key={s} value={s}>{STATUS_ATEND_LABEL[s]}</option>)}
          </select>
          <select className="input-verus" value={canal} onChange={(e) => setCanal(e.target.value)}>
            <option value="">Todos os canais</option>
            {CANAIS_ATENDIMENTO.map((c) => <option key={c} value={c}>{CANAL_LABEL[c]}</option>)}
          </select>
          <select className="input-verus" value={urgencia} onChange={(e) => setUrgencia(e.target.value)}>
            <option value="">Toda urgência</option>
            {URGENCIAS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={soMeus} onChange={(e) => setSoMeus(e.target.checked)} /> meus</label>
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={abertos} onChange={(e) => setAbertos(e.target.checked)} /> só abertos</label>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Relato</th>
                <th>Canal</th>
                <th>Urgência</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Aberto em</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="text-center text-gray-500 py-8">Carregando...</td></tr>}
              {!isLoading && data?.data.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-500 py-10"><Headset className="w-6 h-6 mx-auto mb-2 text-gray-300" />Nenhum atendimento.</td></tr>
              )}
              {data?.data.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/dashboard/clientes/${a.cliente.id}`} className="font-medium text-brand-dark hover:underline">{a.cliente.nome}</Link>
                    <div className="text-xs text-gray-500">{a.cliente.whatsapp || a.cliente.telefone ? formatPhone((a.cliente.whatsapp || a.cliente.telefone)!) : ""}{a.cliente.cidade ? ` · ${a.cliente.cidade}` : ""}</div>
                  </td>
                  <td className="text-sm max-w-[22rem]"><p className="line-clamp-2">{a.descricao}</p>{a._count.visitas > 0 && <span className="text-xs text-gray-500">{a._count.visitas} visita(s)</span>}</td>
                  <td><Badge tone="blue">{CANAL_LABEL[a.canal] ?? a.canal}</Badge></td>
                  <td><Badge tone={urgenciaTone(a.urgencia)}>{a.urgencia}</Badge></td>
                  <td className="text-sm">{a.responsavel.name}</td>
                  <td><Badge tone={statusTone(a.status)}>{STATUS_ATEND_LABEL[a.status] ?? a.status}</Badge></td>
                  <td className="text-sm">{formatDateTime(a.createdAt)}</td>
                  <td>
                    <div className="flex justify-end pr-2">
                      <Link href={`/dashboard/atendimento/${a.id}`} className="p-2 rounded hover:bg-gray-100 text-gray-600"><Eye className="w-4 h-4" /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
            <span>{data.total} atendimento(s) · página {data.page} de {data.totalPages}</span>
            <div className="flex gap-2">
              <button className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</button>
              <button className="btn-outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</button>
            </div>
          </div>
        )}
      </Card>

      <ModalNovo open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
