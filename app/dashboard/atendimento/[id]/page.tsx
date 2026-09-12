"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, MessageCircle, Phone, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UploadFoto } from "@/components/ui/UploadFoto";
import { useAtendimento, useDeleteAtendimento, useUpdateAtendimento } from "@/hooks/useAtendimentos";
import {
  CANAIS_ATENDIMENTO,
  CANAL_LABEL,
  STATUS_ATENDIMENTO,
  STATUS_ATEND_LABEL,
  URGENCIAS,
} from "@/lib/validations/atendimento";
import { atendimentoStatusTone, urgenciaTone } from "@/lib/status";
import { formatDateTime, formatPhone, formatDocumento } from "@/lib/utils";

type Detalhe = {
  id: string;
  canal: string;
  descricao: string;
  urgencia: string;
  status: string;
  fotos: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: {
    id: string; nome: string; tipo: "PF" | "PJ"; documento: string; telefone: string | null; whatsapp: string | null;
    logradouro: string | null; numero: string | null; bairro: string | null; cidade: string | null; uf: string | null;
  };
  responsavel: { id: string; name: string };
  lead: { id: string; status: string; origem: string } | null;
  visitas: { id: string; dataAgendada: string; status: string; endereco: string; tecnico: { name: string } }[];
};

export default function AtendimentoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useAtendimento(id);
  const update = useUpdateAtendimento(id);
  const del = useDeleteAtendimento();
  const usuarios = useQuery<{ id: string; name: string }[]>({ queryKey: ["usuarios"], queryFn: () => fetch("/api/usuarios").then((r) => r.json()) });

  const a = data as Detalhe | undefined;
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    if (!a) return;
    setDescricao(a.descricao);
    try {
      setFotos(a.fotos ? JSON.parse(a.fotos) : []);
    } catch {
      setFotos([]);
    }
  }, [a]);

  if (isLoading || !a) return <p className="text-sm text-gray-500">Carregando…</p>;

  const endereco = [a.cliente.logradouro, a.cliente.numero, a.cliente.bairro, a.cliente.cidade].filter(Boolean).join(", ");
  const tel = a.cliente.whatsapp || a.cliente.telefone;
  const fechado = a.status === "RESOLVIDO" || a.status === "CANCELADO";

  async function mudar(campo: string, valor: string) {
    try {
      await update.mutateAsync({ [campo]: valor } as never);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha");
    }
  }

  async function salvarTexto() {
    try {
      await update.mutateAsync({ descricao, fotos });
      setEditando(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Falha");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/atendimento" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl font-bold text-brand-dark truncate">
            <Link href={`/dashboard/clientes/${a.cliente.id}`} className="hover:underline">{a.cliente.nome}</Link>
          </h2>
          <p className="text-sm text-gray-500">
            {formatDocumento(a.cliente.documento, a.cliente.tipo)} · aberto {formatDateTime(a.createdAt)} · {CANAL_LABEL[a.canal] ?? a.canal}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={urgenciaTone(a.urgencia)}>{a.urgencia}</Badge>
          <Badge tone={atendimentoStatusTone(a.status)}>{STATUS_ATEND_LABEL[a.status] ?? a.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold">Relato</h3>
              {!editando ? (
                <button className="btn-ghost text-sm" onClick={() => setEditando(true)}>Editar</button>
              ) : (
                <div className="flex gap-2">
                  <button className="btn-outline text-sm" onClick={() => { setEditando(false); setDescricao(a.descricao); }}>Cancelar</button>
                  <button className="btn-primary text-sm" onClick={salvarTexto} disabled={update.isPending}>Salvar</button>
                </div>
              )}
            </div>
            {editando ? (
              <textarea className="input-verus" rows={6} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            ) : (
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{a.descricao}</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold">Fotos ({fotos.length})</h3>
              <UploadFoto
                contexto="atendimento"
                onUpload={async (arq) => {
                  const novas = [...fotos, arq.url];
                  setFotos(novas);
                  await update.mutateAsync({ fotos: novas });
                }}
              />
            </div>
            {fotos.length === 0 ? (
              <p className="text-sm text-gray-500">Sem fotos.</p>
            ) : (
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fotos.map((u, i) => (
                  <li key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <a href={u} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="w-full aspect-square object-cover" loading="lazy" />
                    </a>
                    <button
                      className="absolute top-1 right-1 bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100"
                      onClick={async () => {
                        const novas = fotos.filter((_, j) => j !== i);
                        setFotos(novas);
                        await update.mutateAsync({ fotos: novas });
                      }}
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-semibold">Visitas técnicas ({a.visitas.length})</h3>
              <Link
                href={`/dashboard/visita/nova?clienteId=${a.cliente.id}&atendimentoId=${a.id}&endereco=${encodeURIComponent(endereco)}`}
                className="btn-primary text-sm"
              >
                <MapPin className="w-4 h-4" /> Agendar visita
              </Link>
            </div>
            {a.visitas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma visita agendada para este atendimento.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {a.visitas.map((v) => (
                  <li key={v.id} className="py-2 flex items-center gap-3 text-sm">
                    <Link href={`/dashboard/visita/${v.id}`} className="text-brand hover:underline font-medium">{formatDateTime(v.dataAgendada)}</Link>
                    <span className="text-gray-600 truncate flex-1">{v.endereco}</span>
                    <span className="text-gray-500">{v.tecnico.name}</span>
                    <Badge tone="neutral">{v.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-display text-lg font-semibold mb-3">Andamento</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select className="input-verus" value={a.status} onChange={(e) => mudar("status", e.target.value)} disabled={update.isPending}>
                  {STATUS_ATENDIMENTO.map((s) => <option key={s} value={s}>{STATUS_ATEND_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Urgência</label>
                <select className="input-verus" value={a.urgencia} onChange={(e) => mudar("urgencia", e.target.value)} disabled={update.isPending}>
                  {URGENCIAS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Canal</label>
                <select className="input-verus" value={a.canal} onChange={(e) => mudar("canal", e.target.value)} disabled={update.isPending}>
                  {CANAIS_ATENDIMENTO.map((c) => <option key={c} value={c}>{CANAL_LABEL[c]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Responsável</label>
                <select className="input-verus" value={a.responsavel.id} onChange={(e) => mudar("responsavelId", e.target.value)} disabled={update.isPending}>
                  {(usuarios.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            {fechado && <p className="text-xs text-gray-500 mt-3">Fechado em {formatDateTime(a.updatedAt)}.</p>}
          </Card>

          <Card>
            <h3 className="font-display text-lg font-semibold mb-3">Contato</h3>
            {tel ? (
              <div className="space-y-2">
                <a href={`tel:+55${tel.replace(/\D+/g, "")}`} className="flex items-center gap-2 text-sm text-brand hover:underline"><Phone className="w-4 h-4" /> {formatPhone(tel)}</a>
                <a href={`https://wa.me/55${tel.replace(/\D+/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand hover:underline"><MessageCircle className="w-4 h-4" /> Abrir WhatsApp</a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Cliente sem telefone cadastrado.</p>
            )}
            {endereco && <p className="text-sm text-gray-600 mt-3 flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" />{endereco}{a.cliente.uf ? ` — ${a.cliente.uf}` : ""}</p>}
            {a.lead && (
              <p className="text-xs text-gray-500 mt-3">
                Origem: <Link href={`/dashboard/crm/${a.lead.id}`} className="text-brand hover:underline">lead {a.lead.origem}</Link> ({a.lead.status})
              </p>
            )}
          </Card>

          <button
            className="btn-outline w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={async () => {
              if (!confirm("Excluir este atendimento?")) return;
              try {
                await del.mutateAsync(a.id);
                router.push("/dashboard/atendimento");
              } catch (e) {
                alert(e instanceof Error ? e.message : "Falha");
              }
            }}
          >
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
