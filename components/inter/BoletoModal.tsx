"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export type Cobranca = {
  id: string;
  situacao: string;
  valor: number;
  vencimento: string;
  linhaDigitavel: string | null;
  pixCopiaECola: string | null;
  valorRecebido: number | null;
  recebidoEm: string | null;
  canceladaEm: string | null;
  motivoCancelamento: string | null;
  createdAt: string;
};

export const SITUACAO_BOLETO: Record<string, { rotulo: string; tom: "blue" | "green" | "yellow" | "red" | "neutral" }> = {
  EM_PROCESSAMENTO: { rotulo: "Gerando no banco", tom: "neutral" },
  A_RECEBER: { rotulo: "Boleto + PIX enviado ao banco", tom: "blue" },
  ATRASADO: { rotulo: "Boleto vencido", tom: "red" },
  RECEBIDO: { rotulo: "Pago no banco", tom: "green" },
  MARCADO_RECEBIDO: { rotulo: "Marcado pago no app do Inter", tom: "yellow" },
  CANCELADO: { rotulo: "Boleto cancelado", tom: "neutral" },
  EXPIRADO: { rotulo: "Boleto expirado", tom: "neutral" },
};
const VIVAS = ["EM_PROCESSAMENTO", "A_RECEBER", "ATRASADO"];

type Conta = { id: string; descricao: string; valor: number; valorPago: number; vencimento: string; status: string; cliente: { nome: string; whatsapp?: string | null; telefone?: string | null } };

function copiar(t: string) {
  navigator.clipboard?.writeText(t).catch(() => {});
}

/** Boleto com PIX do Inter para uma conta a receber: gerar, mandar, cancelar e ver o histórico. */
export function BoletoModal({ conta, onClose }: { conta: Conta; onClose: () => void }) {
  const qc = useQueryClient();
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Maceio" });
  const vencConta = conta.vencimento.slice(0, 10);
  const daqui3 = new Date(Date.now() + 3 * 864e5).toLocaleDateString("sv-SE", { timeZone: "America/Maceio" });
  const [vencimento, setVencimento] = useState(vencConta >= hoje ? vencConta : daqui3);
  const [motivo, setMotivo] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const lista = useQuery<{ data: Cobranca[] }>({
    queryKey: ["boletos", conta.id],
    queryFn: () => fetch(`/api/contas-receber/${conta.id}/boleto`).then((r) => r.json()),
  });
  const viva = lista.data?.data.find((c) => VIVAS.includes(c.situacao));
  const aberto = Math.round((conta.valor - conta.valorPago) * 100) / 100;

  async function chamar(url: string, metodo: string, corpo?: unknown) {
    setOcupado(true);
    setErro("");
    const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined });
    const j = await r.json().catch(() => ({}));
    setOcupado(false);
    if (!r.ok) {
      setErro(j.error ?? "Não deu certo");
      return false;
    }
    qc.invalidateQueries({ queryKey: ["boletos", conta.id] });
    qc.invalidateQueries({ queryKey: ["contas-receber"] });
    return true;
  }

  const fone = (conta.cliente.whatsapp || conta.cliente.telefone || "").replace(/\D/g, "");
  const foneWa = fone ? (fone.startsWith("55") ? fone : `55${fone}`) : "";
  const textoWa = viva
    ? `Olá, ${conta.cliente.nome.split(" ")[0]}! Segue a cobrança da Verus Impermeabilizações: ${conta.descricao}, ${formatCurrency(viva.valor)}, vencimento ${formatDate(viva.vencimento)}.` +
      (viva.pixCopiaECola ? `\n\nPIX copia e cola:\n${viva.pixCopiaECola}` : "") +
      (viva.linhaDigitavel ? `\n\nBoleto (linha digitável):\n${viva.linhaDigitavel}` : "")
    : "";

  return (
    <Modal open onClose={onClose} title={`Boleto + PIX · ${conta.cliente.nome}`}>
      <div className="space-y-4 text-sm">
        <div className="text-gray-600">{conta.descricao} · falta receber <b>{formatCurrency(aberto)}</b></div>

        {!viva && conta.status !== "PAGA" && (
          <div className="space-y-2 border border-gray-200 rounded-lg p-3">
            <label className="block">Vencimento do boleto
              <input type="date" className="input-verus" min={hoje} value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </label>
            <p className="text-xs text-gray-500">O banco emite um boleto com QR de PIX no mesmo papel, de {formatCurrency(aberto)}. Quando o cliente pagar, a conta fica paga sozinha.</p>
            <button className="btn-primary" disabled={ocupado} onClick={() => chamar(`/api/contas-receber/${conta.id}/boleto`, "POST", { vencimento })}>
              {ocupado ? "Gerando no banco..." : "Gerar boleto + PIX"}
            </button>
          </div>
        )}

        {viva && (
          <div className="space-y-2 border border-blue-200 bg-blue-50/40 rounded-lg p-3">
            <div className="flex items-center gap-2"><Badge tone={SITUACAO_BOLETO[viva.situacao]?.tom ?? "neutral"}>{SITUACAO_BOLETO[viva.situacao]?.rotulo ?? viva.situacao}</Badge> {formatCurrency(viva.valor)} · vence {formatDate(viva.vencimento)}</div>
            {viva.linhaDigitavel && (
              <div><div className="text-xs text-gray-500">Linha digitável</div><div className="font-mono break-all">{viva.linhaDigitavel}</div>
                <button className="text-brand underline text-xs" onClick={() => copiar(viva.linhaDigitavel!)}>copiar</button></div>
            )}
            {viva.pixCopiaECola && (
              <div><div className="text-xs text-gray-500">PIX copia e cola</div><div className="font-mono text-xs break-all line-clamp-2">{viva.pixCopiaECola}</div>
                <button className="text-brand underline text-xs" onClick={() => copiar(viva.pixCopiaECola!)}>copiar</button></div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <a className="btn-outline" href={`/api/contas-receber/boletos/${viva.id}`} target="_blank" rel="noopener noreferrer">Abrir PDF</a>
              {foneWa ? (
                <a className="btn-primary !bg-[#25D366]" href={`https://wa.me/${foneWa}?text=${encodeURIComponent(textoWa)}`} target="_blank" rel="noopener noreferrer">Mandar no WhatsApp</a>
              ) : (
                <span className="text-xs text-gray-500 self-center">cliente sem WhatsApp no cadastro</span>
              )}
              <button className="btn-outline" disabled={ocupado} onClick={() => chamar(`/api/contas-receber/boletos/${viva.id}`, "POST")}>Ver se pagou</button>
              <button className="btn-outline text-red-600" onClick={() => setCancelando(true)}>Cancelar boleto</button>
            </div>
            {cancelando && (
              <div className="space-y-2 pt-2">
                <label className="block">Por que cancelar? (fica guardado)
                  <input className="input-verus" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Valor combinado mudou" />
                </label>
                <button className="btn-primary !bg-red-600" disabled={ocupado} onClick={async () => { if (await chamar(`/api/contas-receber/boletos/${viva.id}`, "PATCH", { motivo })) setCancelando(false); }}>
                  Cancelar no banco
                </button>
              </div>
            )}
          </div>
        )}

        {erro && <p className="text-red-600">{erro}</p>}

        {!!lista.data?.data.filter((c) => c.id !== viva?.id).length && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Boletos anteriores desta conta</div>
            {lista.data.data.filter((c) => c.id !== viva?.id).map((c) => (
              <div key={c.id} className="text-xs text-gray-600 border-t border-gray-100 py-1">
                {formatDate(c.createdAt)} · {formatCurrency(c.valor)} · {SITUACAO_BOLETO[c.situacao]?.rotulo ?? c.situacao}
                {c.valorRecebido != null && ` · recebido ${formatCurrency(c.valorRecebido)}`}
                {c.motivoCancelamento && ` · motivo: ${c.motivoCancelamento}`}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
