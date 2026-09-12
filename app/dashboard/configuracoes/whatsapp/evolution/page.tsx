"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, QrCode, CheckCircle2, XCircle, Loader2, AlertTriangle } from "lucide-react";

interface Status {
  provider: string;
  configurado: boolean;
  state: "conectado" | "conectando" | "desconectado" | "nao_configurado" | "erro";
  detalhe?: string;
}

const info: Record<Status["state"], { txt: string; cor: string; Icon: any }> = {
  conectado: { txt: "Conectado", cor: "#1D9E75", Icon: CheckCircle2 },
  conectando: { txt: "Conectando…", cor: "#F0A500", Icon: Loader2 },
  desconectado: { txt: "Desconectado", cor: "#EF4444", Icon: XCircle },
  nao_configurado: { txt: "Não configurado", cor: "#9CA3AF", Icon: AlertTriangle },
  erro: { txt: "Erro de conexão", cor: "#EF4444", Icon: AlertTriangle },
};

export default function WhatsAppConexaoPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [carregandoQr, setCarregandoQr] = useState(false);
  const [erroQr, setErroQr] = useState<string | null>(null);

  const carregarStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/integracoes/whatsapp/status", { cache: "no-store" });
      const j = await r.json();
      setStatus(j);
      if (j.state === "conectado") setQr(null);
    } catch {
      setStatus({ provider: "?", configurado: false, state: "erro" });
    }
  }, []);

  useEffect(() => {
    carregarStatus();
    const t = setInterval(carregarStatus, 5000);
    return () => clearInterval(t);
  }, [carregarStatus]);

  async function mostrarQr() {
    setCarregandoQr(true);
    setErroQr(null);
    try {
      const r = await fetch("/api/integracoes/whatsapp/qr", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j.error || "Falha ao gerar QR.");
      if (j.base64) setQr(j.base64.startsWith("data:") ? j.base64 : `data:image/png;base64,${j.base64}`);
      else throw new Error("QR não retornado (talvez já conectado).");
    } catch (e) {
      setErroQr(e instanceof Error ? e.message : "Erro.");
    } finally {
      setCarregandoQr(false);
    }
  }

  const s = status ? info[status.state] : info.nao_configurado;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/configuracoes" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">WhatsApp</h2>
          <p className="text-sm text-gray-500">Conexão do número que envia proposta e acompanhamento de obra.</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3">
          <s.Icon className={`w-6 h-6 ${status?.state === "conectando" ? "animate-spin" : ""}`} style={{ color: s.cor }} />
          <div className="flex-1">
            <div className="font-semibold" style={{ color: s.cor }}>{s.txt}</div>
            <div className="text-xs text-gray-500">
              provedor: {status?.provider ?? "—"}{status?.detalhe ? ` · ${status.detalhe}` : ""}
            </div>
          </div>
          <button onClick={carregarStatus} className="btn-outline text-sm"><RefreshCw className="w-4 h-4" /> Atualizar</button>
        </div>
      </div>

      {status?.state === "nao_configurado" && (
        <div className="card !bg-amber-50 !border-amber-200 text-sm text-amber-800 space-y-2">
          <div className="font-semibold">WhatsApp ainda não configurado</div>
          <p>Suba o Evolution API no VPS, escaneie o QR e defina no Vercel (Production):</p>
          <pre className="bg-white/70 rounded p-3 text-xs overflow-x-auto">{`WHATSAPP_PROVIDER=evolution
WHATSAPP_HOST=http://SEU_IP:8080
WHATSAPP_TOKEN=sua-chave
WHATSAPP_INSTANCE=verus`}</pre>
          <p className="text-xs">Depois de configurar, o QR de conexão aparece aqui.</p>
        </div>
      )}

      {status && status.state !== "conectado" && status.state !== "nao_configurado" && (
        <div className="card space-y-4">
          <div className="text-sm text-gray-600">
            Para conectar (ou reconectar) o número, gere o QR e escaneie no celular:
            <b> WhatsApp → Aparelhos conectados → Conectar aparelho</b>.
          </div>
          <button onClick={mostrarQr} disabled={carregandoQr} className="btn-primary">
            {carregandoQr ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />} Gerar QR de conexão
          </button>
          {erroQr && <div className="badge-red !flex items-start gap-2 !rounded-lg !px-3 !py-2 text-sm"><AlertTriangle className="w-4 h-4 mt-0.5" />{erroQr}</div>}
          {qr && (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR WhatsApp" style={{ width: 260, height: 260, imageRendering: "pixelated" }} />
              <div className="text-xs text-gray-500">Escaneie em até 40s. A tela atualiza sozinha quando conectar.</div>
            </div>
          )}
        </div>
      )}

      {status?.state === "conectado" && (
        <div className="card !bg-emerald-50 !border-emerald-200 text-sm text-emerald-800">
          ✓ Número conectado. Os botões de proposta e obra vão enviar o link automaticamente.
        </div>
      )}
    </div>
  );
}
