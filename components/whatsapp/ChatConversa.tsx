"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send, Smartphone, AlertCircle, Check, CheckCheck, FileText, MapPin, Paperclip, LayoutTemplate, Loader2, UserCircle2, X,
} from "lucide-react";
import { formatPhone } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

export type MensagemWA = {
  id: string;
  texto: string;
  tipo: string;
  enviada: boolean;
  status: string;
  statusErro: string | null;
  mediaId: string | null;
  mediaMime: string | null;
  mediaNome: string | null;
  latitude: number | null;
  longitude: number | null;
  viaApp: boolean;
  createdAt: string;
};

export type ConversaDetalhe = {
  id: string;
  telefone: string;
  nome: string | null;
  naoLidas: number;
  responsavelId: string | null;
  linha: { id: string; rotulo: string | null; numeroExibicao: string | null } | null;
  lead: { id: string; status: string; origem: string; nome: string | null; clienteId: string | null } | null;
  mensagens: MensagemWA[];
};

type Template = {
  name: string;
  language: string;
  category: string;
  body: string;
  header?: { format: string; text?: string } | null;
  footer?: string | null;
  variaveis: number;
  botoes: string[];
};

function StatusIcon({ m }: { m: MensagemWA }) {
  if (!m.enviada) return null;
  if (m.status === "failed") return <AlertCircle className="w-3 h-3 text-red-500" />;
  if (m.status === "read") return <CheckCheck className="w-3 h-3 text-sky-500" />;
  if (m.status === "delivered") return <CheckCheck className="w-3 h-3 text-gray-400" />;
  return <Check className="w-3 h-3 text-gray-400" />;
}

function Midia({ m }: { m: MensagemWA }) {
  if (m.tipo === "LOCATION" && m.latitude != null && m.longitude != null) {
    return (
      <a className="flex items-center gap-1 text-xs underline" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${m.latitude},${m.longitude}`}>
        <MapPin className="w-3 h-3" /> abrir no mapa
      </a>
    );
  }
  if (!m.mediaId) return null;
  const src = `/api/whatsapp/midia/${m.mediaId}`;
  if (m.tipo === "IMAGE" || m.tipo === "STICKER") return <img src={src} alt="" className="rounded-lg max-w-[240px] mb-1" loading="lazy" />;
  if (m.tipo === "AUDIO") return <audio controls src={src} className="max-w-[240px] mb-1" />;
  if (m.tipo === "VIDEO") return <video controls src={src} className="rounded-lg max-w-[240px] mb-1" />;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs underline mb-1">
      <FileText className="w-3 h-3" /> {m.mediaNome ?? "documento"}
    </a>
  );
}

/** Janela de 24h: última mensagem recebida do cliente há menos de 24h libera texto livre. */
function dentroDaJanela(msgs: MensagemWA[]): boolean {
  const ultimaRecebida = [...msgs].reverse().find((m) => !m.enviada);
  if (!ultimaRecebida) return false;
  return Date.now() - new Date(ultimaRecebida.createdAt).getTime() < 24 * 60 * 60 * 1000;
}

function ModalTemplate({
  open,
  onClose,
  conversaId,
  linhaId,
  nomeCliente,
}: {
  open: boolean;
  onClose: () => void;
  conversaId: string;
  linhaId: string | null;
  nomeCliente: string;
}) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery<{ data: Template[] }>({
    enabled: open,
    queryKey: ["wa-templates", linhaId],
    queryFn: async () => {
      const r = await fetch(`/api/whatsapp/templates${linhaId ? `?linhaId=${linhaId}` : ""}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Falha ao listar templates");
      return d;
    },
    staleTime: 5 * 60 * 1000,
  });
  const [sel, setSel] = useState<Template | null>(null);
  const [params, setParams] = useState<string[]>([]);
  const [cabecalho, setCabecalho] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSel(null);
      setParams([]);
      setCabecalho("");
      setErro(null);
    }
  }, [open]);

  useEffect(() => {
    if (!sel) return;
    const p = Array.from({ length: sel.variaveis }, (_, i) => (i === 0 ? nomeCliente.split(" ")[0] ?? "" : ""));
    setParams(p);
  }, [sel, nomeCliente]);

  const preview = sel ? sel.body.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] || `{{${n}}}`) : "";

  async function enviar() {
    if (!sel) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/whatsapp/conversas/${conversaId}/template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: sel.name, idioma: sel.language, corpo: params, cabecalho: sel.header?.format === "TEXT" && sel.header.text?.includes("{{") ? cabecalho : undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Falha no envio");
      qc.invalidateQueries({ queryKey: ["conversa", conversaId] });
      qc.invalidateQueries({ queryKey: ["conversas"] });
      onClose();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Enviar template aprovado">
      {isLoading && <p className="text-sm text-gray-500">Carregando templates da Meta…</p>}
      {error && <p className="text-sm text-danger">{(error as Error).message}</p>}
      {data && !sel && (
        <div className="space-y-2">
          {data.data.length === 0 && <p className="text-sm text-gray-500">Nenhum template aprovado. Crie em business.facebook.com → WhatsApp Manager → Modelos.</p>}
          {data.data.map((t) => (
            <button key={`${t.name}-${t.language}`} onClick={() => setSel(t)} className="w-full text-left border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{t.name}</span>
                <span className="text-[10px] uppercase text-gray-400">{t.category} · {t.language}</span>
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{t.body}</p>
            </button>
          ))}
        </div>
      )}
      {sel && (
        <div className="space-y-3">
          <button className="text-xs text-brand hover:underline" onClick={() => setSel(null)}>← escolher outro</button>
          {sel.header?.format === "TEXT" && sel.header.text?.includes("{{") && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cabeçalho: {sel.header.text}</label>
              <input className="input-verus" value={cabecalho} onChange={(e) => setCabecalho(e.target.value)} />
            </div>
          )}
          {params.map((p, i) => (
            <div key={i}>
              <label className="block text-xs font-medium text-gray-600 mb-1">Variável {`{{${i + 1}}}`}</label>
              <input className="input-verus" value={p} onChange={(e) => setParams((v) => v.map((x, j) => (j === i ? e.target.value : x)))} />
            </div>
          ))}
          <div className="bg-[#efeae2] rounded-lg p-3">
            <div className="bg-[#d9fdd3] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap max-w-[90%] ml-auto shadow-sm">
              {sel.header?.format === "TEXT" && sel.header.text && <p className="font-semibold mb-1">{sel.header.text.replace("{{1}}", cabecalho || "{{1}}")}</p>}
              {preview}
              {sel.footer && <p className="text-[11px] text-gray-500 mt-1">{sel.footer}</p>}
              {sel.botoes.length > 0 && <p className="text-[11px] text-sky-700 mt-1">{sel.botoes.join(" · ")}</p>}
            </div>
          </div>
          {erro && <p className="text-xs text-danger">{erro}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-outline" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={enviar} disabled={enviando || params.some((p) => !p.trim())}>
              {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function ChatConversa({ conversaId, altura = "60vh" }: { conversaId: string; altura?: string }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modalTemplate, setModalTemplate] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<ConversaDetalhe>({
    queryKey: ["conversa", conversaId],
    queryFn: async () => {
      const r = await fetch(`/api/whatsapp/conversas/${conversaId}`);
      if (!r.ok) throw new Error("Erro ao carregar conversa");
      return r.json();
    },
    refetchInterval: 8000,
  });

  const usuarios = useQuery<{ id: string; name: string }[]>({
    queryKey: ["usuarios"],
    queryFn: () => fetch("/api/usuarios").then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [data?.mensagens.length]);

  async function enviar(e?: React.FormEvent) {
    e?.preventDefault();
    const t = texto.trim();
    if ((!t && !arquivo) || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      let r: Response;
      if (arquivo) {
        const fd = new FormData();
        fd.append("file", arquivo);
        if (t) fd.append("legenda", t);
        r = await fetch(`/api/whatsapp/conversas/${conversaId}/enviar`, { method: "POST", body: fd });
      } else {
        r = await fetch(`/api/whatsapp/conversas/${conversaId}/enviar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto: t }),
        });
      }
      const d = await r.json();
      if (!r.ok) setErro(d.error ?? "Falha no envio");
      setTexto("");
      setArquivo(null);
      qc.invalidateQueries({ queryKey: ["conversa", conversaId] });
      qc.invalidateQueries({ queryKey: ["conversas"] });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no envio");
    } finally {
      setEnviando(false);
    }
  }

  async function atribuir(responsavelId: string) {
    await fetch(`/api/whatsapp/conversas/${conversaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responsavelId: responsavelId || null }),
    });
    qc.invalidateQueries({ queryKey: ["conversa", conversaId] });
    qc.invalidateQueries({ queryKey: ["conversas"] });
  }

  if (isLoading || !data) return <p className="text-sm text-gray-500 p-4">Carregando conversa…</p>;

  const janelaAberta = dentroDaJanela(data.mensagens);
  const nomeCliente = data.nome ?? data.lead?.nome ?? "";

  return (
    <div className="flex flex-col" style={{ height: altura }}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-200 bg-white">
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-900 truncate">{data.nome ?? formatPhone(data.telefone.replace(/^55/, ""))}</p>
          <p className="text-xs text-gray-500 truncate">
            +{data.telefone}{data.linha ? ` · via ${data.linha.rotulo ?? data.linha.numeroExibicao ?? "linha"}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-1 text-xs text-gray-500" title="Responsável pela conversa">
            <UserCircle2 className="w-4 h-4" />
            <select className="input-verus !py-1 !text-xs !w-auto" value={data.responsavelId ?? ""} onChange={(e) => atribuir(e.target.value)}>
              <option value="">sem dono</option>
              {(usuarios.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </label>
          <a href={`https://wa.me/${data.telefone}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs" title="Abrir no WhatsApp">
            <Smartphone className="w-4 h-4" /> <span className="hidden lg:inline">abrir no app</span>
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#efeae2] px-3 py-3 space-y-1.5">
        {data.mensagens.length === 0 && <p className="text-xs text-gray-500 text-center py-6">Sem mensagens ainda.</p>}
        {data.mensagens.map((m) => (
          <div key={m.id} className={`flex ${m.enviada ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-1.5 text-sm shadow-sm ${m.enviada ? "bg-[#d9fdd3]" : "bg-white"}`}>
              <Midia m={m} />
              {m.tipo === "TEMPLATE" && <span className="text-[10px] uppercase text-gray-400 block">template</span>}
              <p className="whitespace-pre-wrap break-words">{m.texto}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-gray-500">
                {m.viaApp && <span title="enviada pelo celular"><Smartphone className="w-3 h-3" /></span>}
                <span>{new Date(m.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                <StatusIcon m={m} />
              </div>
              {m.statusErro && <p className="text-[10px] text-red-600 mt-0.5">{m.statusErro}</p>}
            </div>
          </div>
        ))}
        <div ref={fim} />
      </div>

      {!janelaAberta && (
        <div className="px-3 py-1.5 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Cliente não escreveu nas últimas 24h — a Meta só entrega <button className="underline font-medium" onClick={() => setModalTemplate(true)}>template aprovado</button>.
        </div>
      )}

      {arquivo && (
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-xs flex items-center gap-2">
          <Paperclip className="w-3.5 h-3.5" />
          <span className="truncate flex-1">{arquivo.name} · {(arquivo.size / 1024).toFixed(0)} KB</span>
          <button onClick={() => setArquivo(null)} className="p-1 rounded hover:bg-gray-200"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <form onSubmit={enviar} className="flex items-end gap-2 p-2 border-t border-gray-200 bg-white">
        <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
        <button type="button" className="btn-ghost p-2" title="Anexar arquivo" onClick={() => fileRef.current?.click()} disabled={enviando}>
          <Paperclip className="w-4 h-4" />
        </button>
        <button type="button" className="btn-ghost p-2" title="Enviar template aprovado" onClick={() => setModalTemplate(true)} disabled={enviando}>
          <LayoutTemplate className="w-4 h-4" />
        </button>
        <textarea
          className="input-verus resize-none"
          rows={2}
          placeholder={arquivo ? "Legenda (opcional)… Enter envia" : "Escreva a mensagem… (Enter envia, Shift+Enter quebra linha)"}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
        />
        <button type="submit" className="btn-primary" disabled={enviando || (!texto.trim() && !arquivo)} aria-label="Enviar">
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      {erro && <p className="text-xs text-red-600 px-3 pb-2">{erro}</p>}

      <ModalTemplate open={modalTemplate} onClose={() => setModalTemplate(false)} conversaId={conversaId} linhaId={data.linha?.id ?? null} nomeCliente={nomeCliente} />
    </div>
  );
}
