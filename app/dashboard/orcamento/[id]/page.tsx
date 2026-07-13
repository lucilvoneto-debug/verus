"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  XCircle,
  Clock,
  ScrollText,
  Download,
  MessageCircle,
  Link2,
  Copy,
  Files,
} from "lucide-react";
import {
  useOrcamento,
  useChangeOrcamentoStatus,
  useGerarContrato,
} from "@/hooks/useOrcamentos";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  RASCUNHO: "neutral",
  ENVIADO: "blue",
  APROVADO: "green",
  RECUSADO: "red",
  VENCIDO: "yellow",
};

export default function OrcamentoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: orc, isLoading } = useOrcamento(params.id);
  const changeStatus = useChangeOrcamentoStatus(params.id);
  const gerarContrato = useGerarContrato(params.id);
  const [waOpen, setWaOpen] = useState(false);
  const [waTelefone, setWaTelefone] = useState("");
  const [waMensagem, setWaMensagem] = useState("");
  const [waEnviando, setWaEnviando] = useState(false);
  const [linkProposta, setLinkProposta] = useState<string | null>(null);
  const [gerandoLink, setGerandoLink] = useState(false);
  const [envioInfo, setEnvioInfo] = useState<{ autoEnviado: boolean; telefone: string | null; motivo?: string } | null>(null);

  async function gerarLink() {
    setGerandoLink(true);
    try {
      const r = await fetch(`/api/orcamento/${params.id}/link`, { method: "POST", headers: { origin: window.location.origin } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao gerar link.");
      setLinkProposta(j.url);
      setEnvioInfo({ autoEnviado: j.autoEnviado, telefone: j.telefone, motivo: j.motivo });
      try { await navigator.clipboard.writeText(j.url); } catch { /* clipboard bloqueado */ }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro.");
    } finally {
      setGerandoLink(false);
    }
  }

  async function duplicar() {
    try {
      const r = await fetch(`/api/orcamento/${params.id}/duplicar`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao duplicar.");
      router.push(`/dashboard/orcamento/${j.id}/editar`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro.");
    }
  }

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!orc) return <div className="text-gray-500">Orçamento não encontrado.</div>;

  async function setStatus(s: string) {
    try {
      await changeStatus.mutateAsync(s);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  function abrirWhatsApp() {
    if (!orc) return;
    const tel = orc.cliente?.whatsapp ?? orc.cliente?.telefone ?? "";
    const msg = `Olá ${orc.cliente?.nome ?? ""}, segue seu orçamento ${orc.numero}: ${formatCurrency(orc.total)}.`;
    setWaTelefone(tel);
    setWaMensagem(msg);
    setWaOpen(true);
  }

  async function enviarWhatsApp() {
    setWaEnviando(true);
    try {
      const res = await fetch("/api/integracoes/whatsapp/enviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone: waTelefone, mensagem: waMensagem }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(json.error ?? "Erro ao enviar.");
      } else {
        alert(json.id === "mock" ? "Mensagem registrada (modo mock)." : "Mensagem enviada.");
        setWaOpen(false);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setWaEnviando(false);
    }
  }

  async function handleGerarContrato() {
    if (!confirm("Gerar contrato a partir deste orçamento?")) return;
    try {
      const c = await gerarContrato.mutateAsync();
      router.push(`/dashboard/contratos/${c.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/orcamento" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{orc.numero}</h2>
          <p className="text-sm text-gray-500">
            {orc.cliente?.nome} ·{" "}
            <Badge tone={statusTone[orc.status] ?? "neutral"}>{orc.status}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/dashboard/orcamento/${orc.id}/editar`} className="btn-outline">
            <Pencil className="w-4 h-4" /> Editar
          </Link>
          <a
            href={`/api/orcamento/${orc.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            <Download className="w-4 h-4" /> PDF
          </a>
          <button onClick={abrirWhatsApp} className="btn-outline">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
          <button onClick={duplicar} className="btn-outline">
            <Files className="w-4 h-4" /> Duplicar
          </button>
          <button onClick={gerarLink} disabled={gerandoLink} className="btn-primary">
            <Link2 className="w-4 h-4" /> {gerandoLink ? "Gerando…" : "Link p/ aprovar"}
          </button>
          {orc.status !== "APROVADO" && (
            <button
              onClick={() => setStatus("APROVADO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <CheckCircle className="w-4 h-4" /> Aprovar
            </button>
          )}
          {orc.status !== "RECUSADO" && (
            <button
              onClick={() => setStatus("RECUSADO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <XCircle className="w-4 h-4" /> Recusar
            </button>
          )}
          {orc.status !== "VENCIDO" && (
            <button
              onClick={() => setStatus("VENCIDO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <Clock className="w-4 h-4" /> Marcar vencido
            </button>
          )}
          {orc.status === "APROVADO" && !orc.contrato && (
            <button
              onClick={handleGerarContrato}
              disabled={gerarContrato.isPending}
              className="btn-primary"
            >
              <ScrollText className="w-4 h-4" /> Gerar contrato
            </button>
          )}
          {orc.contrato && (
            <Link href={`/dashboard/contratos/${orc.contrato.id}`} className="btn-primary">
              <ScrollText className="w-4 h-4" /> Ver contrato
            </Link>
          )}
        </div>
      </div>

      {linkProposta && (
        <div className="card !bg-brand-light !border-brand/30 flex flex-wrap items-center gap-3">
          <Link2 className="w-5 h-5 text-brand shrink-0" />
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm font-medium text-brand-dark">
              {envioInfo?.autoEnviado
                ? `✓ Enviado automático no WhatsApp ${envioInfo.telefone ?? ""}`
                : "Link da proposta (copiado)"}
            </div>
            {!envioInfo?.autoEnviado && envioInfo?.motivo && (
              <div className="text-xs text-amber-600">{envioInfo.motivo}</div>
            )}
            <a href={linkProposta} target="_blank" rel="noopener noreferrer" className="text-xs text-brand break-all underline">{linkProposta}</a>
          </div>
          <button onClick={() => navigator.clipboard.writeText(linkProposta)} className="btn-outline text-sm">
            <Copy className="w-4 h-4" /> Copiar
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Proposta Verus ${orc.numero}: ${linkProposta}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa text-sm"
            style={{ background: "#25D366", color: "#fff", display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, fontWeight: 600 }}
          >
            <MessageCircle className="w-4 h-4" /> Enviar no WhatsApp
          </a>
        </div>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field label="Cliente" value={orc.cliente?.nome ?? "—"} />
          <Field label="Vendedor" value={orc.vendedor?.name ?? "—"} />
          <Field label="Validade" value={formatDate(orc.dataValidade)} />
          <Field label="Criado em" value={formatDate(orc.criadoEm)} />
          <Field
            label="Aprovado em"
            value={orc.aprovadoEm ? formatDate(orc.aprovadoEm) : "—"}
          />
          <Field
            label="Visita vinculada"
            value={
              orc.visita
                ? `${formatDate(orc.visita.dataAgendada)} — ${orc.visita.endereco}`
                : "—"
            }
          />
          <Field label="Condição de pagamento" value={orc.condicaoPagamento ?? "—"} />
          <Field label="Prazo de execução" value={orc.prazoExecucao ?? "—"} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Unid.</th>
                <th>Preço unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orc.itens.map(
                (it: {
                  id: string;
                  servico: { nome: string };
                  descricao: string;
                  quantidade: number;
                  unidade: string;
                  precoUnit: number;
                  subtotal: number;
                }) => (
                  <tr key={it.id}>
                    <td className="font-medium">{it.servico.nome}</td>
                    <td>{it.descricao}</td>
                    <td className="tabular-nums">{it.quantidade}</td>
                    <td>{it.unidade}</td>
                    <td>{formatCurrency(it.precoUnit)}</td>
                    <td>{formatCurrency(it.subtotal)}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <Field label="Subtotal" value={formatCurrency(orc.subtotal)} />
          <Field label="Desconto" value={formatCurrency(orc.desconto)} />
          <Field label="Total" value={formatCurrency(orc.total)} highlight />
          <Field
            label="Margem prevista"
            value={`${orc.margemPrevista.toFixed(1)}%`}
            highlight
          />
        </div>
        {orc.observacoes && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Observações
            </div>
            <p className="text-sm whitespace-pre-wrap">{orc.observacoes}</p>
          </div>
        )}
      </Card>

      <Modal open={waOpen} onClose={() => setWaOpen(false)} title="Enviar por WhatsApp">
        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Telefone
            </label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={waTelefone}
              onChange={(e) => setWaTelefone(e.target.value)}
              placeholder="DDI + DDD + número"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Mensagem
            </label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={5}
              value={waMensagem}
              onChange={(e) => setWaMensagem(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setWaOpen(false)}>
              Cancelar
            </button>
            <button className="btn-primary" disabled={waEnviando} onClick={enviarWhatsApp}>
              <MessageCircle className="w-4 h-4" /> Enviar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div
        className={
          highlight
            ? "font-display text-lg font-semibold text-brand-dark"
            : "text-gray-900"
        }
      >
        {value}
      </div>
    </div>
  );
}
