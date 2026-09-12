"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Smartphone, AlertCircle, Check, CheckCheck, FileText, MapPin } from "lucide-react";
import { formatPhone } from "@/lib/utils";

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
  linha: { id: string; rotulo: string | null; numeroExibicao: string | null } | null;
  lead: { id: string; status: string; origem: string; nome: string | null; clienteId: string | null } | null;
  mensagens: MensagemWA[];
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

export function ChatConversa({ conversaId, altura = "60vh" }: { conversaId: string; altura?: string }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<ConversaDetalhe>({
    queryKey: ["conversa", conversaId],
    queryFn: async () => {
      const r = await fetch(`/api/whatsapp/conversas/${conversaId}`);
      if (!r.ok) throw new Error("Erro ao carregar conversa");
      return r.json();
    },
    refetchInterval: 8000,
  });

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [data?.mensagens.length]);

  async function enviar(e?: React.FormEvent) {
    e?.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/whatsapp/conversas/${conversaId}/enviar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: t }),
      });
      const d = await r.json();
      if (!r.ok) setErro(d.error ?? "Falha no envio");
      setTexto("");
      qc.invalidateQueries({ queryKey: ["conversa", conversaId] });
      qc.invalidateQueries({ queryKey: ["conversas"] });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no envio");
    } finally {
      setEnviando(false);
    }
  }

  if (isLoading || !data) return <p className="text-sm text-gray-500 p-4">Carregando conversa…</p>;

  return (
    <div className="flex flex-col" style={{ height: altura }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white">
        <div>
          <p className="font-medium text-sm text-gray-900">{data.nome ?? formatPhone(data.telefone.replace(/^55/, ""))}</p>
          <p className="text-xs text-gray-500">
            +{data.telefone}{data.linha ? ` · via ${data.linha.rotulo ?? data.linha.numeroExibicao ?? "linha"}` : ""}
          </p>
        </div>
        <a href={`https://wa.me/${data.telefone}`} target="_blank" rel="noreferrer" className="btn-ghost text-xs" title="Abrir no WhatsApp">
          <Smartphone className="w-4 h-4" /> abrir no app
        </a>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#efeae2] px-3 py-3 space-y-1.5">
        {data.mensagens.length === 0 && <p className="text-xs text-gray-500 text-center py-6">Sem mensagens ainda.</p>}
        {data.mensagens.map((m) => (
          <div key={m.id} className={`flex ${m.enviada ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-lg px-3 py-1.5 text-sm shadow-sm ${m.enviada ? "bg-[#d9fdd3]" : "bg-white"}`}>
              <Midia m={m} />
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

      <form onSubmit={enviar} className="flex items-end gap-2 p-2 border-t border-gray-200 bg-white">
        <textarea
          className="input-verus resize-none"
          rows={2}
          placeholder="Escreva a mensagem… (Enter envia, Shift+Enter quebra linha)"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
        />
        <button type="submit" className="btn-primary" disabled={enviando || !texto.trim()} aria-label="Enviar">
          <Send className="w-4 h-4" />
        </button>
      </form>
      {erro && <p className="text-xs text-red-600 px-3 pb-2">{erro}</p>}
    </div>
  );
}
