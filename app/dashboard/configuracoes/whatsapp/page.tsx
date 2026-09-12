"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Smartphone, CheckCircle2, AlertTriangle } from "lucide-react";

/**
 * Coexistência — Embedded Signup oficial da Meta.
 *
 * Conecta o número que JÁ roda no app WhatsApp Business à Cloud API sem apagar
 * nada: o app continua no celular, com grupos e histórico; o ERP passa a
 * receber e enviar pela API oficial. O popup da Meta mostra um QR pra escanear
 * no WhatsApp Business (Configurações → Dispositivos conectados). Histórico de
 * até 6 meses chega pelo webhook `history`.
 *
 * Pré-requisitos no app da Meta (developers.facebook.com):
 *  - NEXT_PUBLIC_META_APP_ID e NEXT_PUBLIC_META_ES_CONFIG_ID no env
 *  - domínio do ERP liberado em "Login do Facebook para Empresas"
 *  - webhook apontando pra /api/webhooks/meta com META_WEBHOOK_VERIFY_TOKEN
 */

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID ?? "";
const ES_CONFIG_ID = process.env.NEXT_PUBLIC_META_ES_CONFIG_ID ?? "";

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

type Linha = {
  id: string;
  phoneNumberId: string;
  numeroExibicao: string | null;
  nomeVerificado: string | null;
  rotulo: string | null;
  responsavelId: string | null;
  padrao: boolean;
  ativo: boolean;
  meta: { display_phone_number?: string; verified_name?: string; status?: string; platform_type?: string; quality_rating?: string; wabaNome?: string; webhookOk?: boolean } | null;
};

export default function WhatsAppConexaoPage() {
  const [sdkPronto, setSdkPronto] = useState(false);
  const [eventos, setEventos] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [soNaMeta, setSoNaMeta] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [configurado, setConfigurado] = useState(false);
  const [usuarios, setUsuarios] = useState<{ id: string; name: string }[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [edicao, setEdicao] = useState<Record<string, { rotulo: string; responsavelId: string }>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const codeRef = useRef<string | null>(null);

  const log = (m: string) => setEventos((p) => [...p.slice(-20), `${new Date().toLocaleTimeString("pt-BR")} — ${m}`]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await fetch("/api/whatsapp/linhas", { cache: "no-store" });
      const d = await r.json();
      if (r.ok) {
        setLinhas(d.linhas ?? []);
        setSoNaMeta(d.soNaMeta ?? []);
        setAvisos(d.avisos ?? []);
        setConfigurado(!!d.configurado);
        setEdicao((prev) => {
          const n = { ...prev };
          for (const l of d.linhas ?? []) if (!n[l.id]) n[l.id] = { rotulo: l.rotulo ?? "", responsavelId: l.responsavelId ?? "" };
          return n;
        });
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
    fetch("/api/usuarios").then((r) => (r.ok ? r.json() : [])).then(setUsuarios).catch(() => {});
  }, [carregar]);

  useEffect(() => {
    function onMessage(ev: MessageEvent) {
      if (!String(ev.origin).endsWith("facebook.com")) return;
      try {
        const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
        log(`evento: ${data.event ?? "?"}`);
        if (["FINISH", "FINISH_ONLY_WABA", "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING"].includes(data.event)) {
          finalizar(data.data ?? {});
        } else if (data.event === "CANCEL" || data.event === "ERROR") {
          log(`cancelado/erro: ${JSON.stringify(data.data ?? {})}`);
        }
      } catch { /* outros widgets */ }
    }
    window.addEventListener("message", onMessage);

    if (META_APP_ID && !document.getElementById("facebook-jssdk")) {
      window.fbAsyncInit = () => {
        window.FB?.init({ appId: META_APP_ID, autoLogAppEvents: true, xfbml: false, version: "v21.0" });
        setSdkPronto(true);
        log("SDK da Meta carregada");
      };
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/pt_BR/sdk.js";
      js.async = true;
      document.body.appendChild(js);
    } else if (window.FB) setSdkPronto(true);

    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function finalizar(signup: any) {
    log(`concluído: waba=${signup.waba_id ?? "?"} phone=${signup.phone_number_id ?? "?"}`);
    try {
      const r = await fetch("/api/whatsapp/meta/es-exchange", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeRef.current, signup }),
      });
      const d = await r.json();
      log(d.ok ? `token trocado ✓ · webhook ${d.webhookOk ? "inscrito" : "pendente"}` : `troca falhou: ${d.error ?? "?"}`);
    } catch (e) {
      log(`troca falhou: ${e instanceof Error ? e.message : e}`);
    } finally {
      carregar();
    }
  }

  function conectar() {
    if (!window.FB) return;
    log("abrindo popup da Meta…");
    window.FB.login(
      (resp: any) => {
        codeRef.current = resp?.authResponse?.code ?? null;
        log(codeRef.current ? "code recebido" : `login sem code (${resp?.status ?? "?"})`);
      },
      {
        config_id: ES_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {}, featureType: "whatsapp_business_app_onboarding", sessionInfoVersion: "3" },
      },
    );
  }

  async function salvarLinha(l: Linha, extra: Record<string, unknown> = {}) {
    const e = edicao[l.id] ?? { rotulo: l.rotulo ?? "", responsavelId: l.responsavelId ?? "" };
    setSalvando(l.id);
    try {
      await fetch("/api/whatsapp/linhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId: l.phoneNumberId, rotulo: e.rotulo, responsavelId: e.responsavelId || null, ...extra }),
      });
      log(`linha ${e.rotulo || l.phoneNumberId} salva ✓`);
    } finally {
      setSalvando(null);
      carregar();
    }
  }

  async function adicionarDaMeta(f: any) {
    setSalvando(f.id);
    try {
      await fetch("/api/whatsapp/linhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumberId: String(f.id), wabaId: f.wabaId, rotulo: f.verified_name, numeroExibicao: f.display_phone_number, padrao: linhas.length === 0 }),
      });
    } finally {
      setSalvando(null);
      carregar();
    }
  }

  const faltaEnv = !META_APP_ID || !ES_CONFIG_ID;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/configuracoes" className="btn-ghost"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">WhatsApp — API oficial (coexistência)</h2>
          <p className="text-sm text-gray-500">
            Conecta o número que já roda no app WhatsApp Business à Cloud API. O celular continua funcionando; o ERP passa a ver e responder as conversas.
          </p>
        </div>
      </div>

      <div className="card">
        {faltaEnv ? (
          <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              Faltam <code>NEXT_PUBLIC_META_APP_ID</code> e <code>NEXT_PUBLIC_META_ES_CONFIG_ID</code> no ambiente (Vercel → Environment Variables). Sem eles o botão de conexão não abre.
            </div>
          </div>
        ) : (
          <button onClick={conectar} disabled={!sdkPronto} className="btn-primary">
            <Smartphone className="w-4 h-4" /> {sdkPronto ? "Conectar número (abre popup da Meta)" : "Carregando SDK…"}
          </button>
        )}
        <ol className="mt-4 text-xs text-gray-600 list-decimal pl-5 space-y-1">
          <li>Tenha em mãos o celular com o WhatsApp Business do número.</li>
          <li>No popup, escolha <strong>continuar usando o aplicativo</strong> (coexistência) e escaneie o QR no app: Configurações → Dispositivos conectados.</li>
          <li>Ao terminar, o número aparece abaixo. Dê um nome e um responsável — a conversa cai na caixa dele.</li>
        </ol>
        {eventos.length > 0 && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-700 space-y-0.5">
            {eventos.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-brand-dark">Números conectados</h3>
          <button onClick={carregar} className="btn-outline text-xs" disabled={carregando}><RefreshCw className={`w-3 h-3 ${carregando ? "animate-spin" : ""}`} /> Atualizar</button>
        </div>
        {!configurado && !carregando && (
          <p className="mt-2 text-xs text-amber-700">Token da Meta ainda não disponível — conecte um número acima ou defina <code>META_ACCESS_TOKEN</code>.</p>
        )}
        {linhas.length === 0 && !carregando && <p className="mt-3 text-sm text-gray-500">Nenhum número conectado ainda.</p>}
        <div className="mt-3 space-y-3">
          {linhas.map((l) => {
            const e = edicao[l.id] ?? { rotulo: l.rotulo ?? "", responsavelId: l.responsavelId ?? "" };
            const alterado = e.rotulo !== (l.rotulo ?? "") || e.responsavelId !== (l.responsavelId ?? "");
            const numero = l.meta?.display_phone_number ?? (l.numeroExibicao ? `+${l.numeroExibicao}` : l.phoneNumberId);
            return (
              <div key={l.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-lg font-semibold text-gray-900">{numero}</span>
                  {l.padrao && <span className="badge-blue">Padrão (empresa)</span>}
                  {l.meta ? (
                    l.meta.status === "CONNECTED" ? <span className="badge-green"><CheckCircle2 className="w-3 h-3 mr-1" /> Conectado</span> : <span className="badge-yellow">{l.meta.status ?? "?"}</span>
                  ) : <span className="badge-neutral">Não encontrado na Meta</span>}
                  {l.meta && (l.meta.webhookOk ? <span className="badge-green">Webhook ok</span> : <span className="badge-yellow">Webhook pendente</span>)}
                  {l.meta?.platform_type === "CLOUD_API" && l.meta?.quality_rating && <span className="badge-neutral">qualidade {l.meta.quality_rating}</span>}
                  {!l.ativo && <span className="badge-neutral">Inativa</span>}
                </div>
                {(l.meta?.verified_name ?? l.nomeVerificado) && (
                  <div className="mt-1 text-xs text-gray-500">Nome na Meta: {l.meta?.verified_name ?? l.nomeVerificado}{l.meta?.wabaNome ? ` · ${l.meta.wabaNome}` : ""}</div>
                )}
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <label className="text-xs text-gray-600">Nome da linha
                    <input className="input-verus mt-1 w-44" value={e.rotulo} placeholder="ex.: Empresa" onChange={(ev) => setEdicao((p) => ({ ...p, [l.id]: { ...e, rotulo: ev.target.value } }))} />
                  </label>
                  <label className="text-xs text-gray-600">Responsável (dono da caixa)
                    <select className="input-verus mt-1 w-52" value={e.responsavelId} onChange={(ev) => setEdicao((p) => ({ ...p, [l.id]: { ...e, responsavelId: ev.target.value } }))}>
                      <option value="">— sem responsável —</option>
                      {usuarios.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </label>
                  <button className="btn-primary text-sm" disabled={!alterado || salvando === l.id} onClick={() => salvarLinha(l)}>
                    {salvando === l.id ? "Salvando…" : "Salvar"}
                  </button>
                  {!l.padrao && <button className="btn-outline text-sm" onClick={() => salvarLinha(l, { padrao: true })}>Tornar padrão</button>}
                </div>
              </div>
            );
          })}
        </div>

        {soNaMeta.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold text-gray-800">Conectados na Meta mas fora do sistema</h4>
            <div className="mt-2 space-y-2">
              {soNaMeta.map((f: any) => (
                <div key={f.id} className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 p-3 text-sm">
                  <span className="font-medium">{f.display_phone_number ?? f.id}</span>
                  <span className="text-xs text-gray-500">{f.verified_name}</span>
                  <button className="btn-outline ml-auto text-xs" disabled={salvando === f.id} onClick={() => adicionarDaMeta(f)}>Adicionar ao sistema</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {avisos.length > 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 space-y-0.5">
            {avisos.map((a, i) => <div key={i}>{a}</div>)}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Conexão antiga por QR (Evolution): <Link className="underline" href="/dashboard/configuracoes/whatsapp/evolution">abrir</Link>. Com a API oficial ativa, desligue a Evolution pra não duplicar mensagens.
      </p>
    </div>
  );
}
