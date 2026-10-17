"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export type PagamentoBanco = { id: string; tipo: string; destino: string; valor: number; status: string; createdAt: string; resposta: string | null };

export const SITUACAO_PAGAMENTO: Record<string, { rotulo: string; tom: "blue" | "green" | "yellow" | "red" | "neutral" }> = {
  ENVIADO: { rotulo: "Mandado ao Inter", tom: "blue" },
  AGUARDANDO_APROVACAO: { rotulo: "Esperando aprovação no app do Inter", tom: "yellow" },
  AGENDADO: { rotulo: "Agendado no Inter", tom: "blue" },
  PAGO: { rotulo: "Pago pelo Inter", tom: "green" },
  RECUSADO: { rotulo: "Banco recusou", tom: "red" },
  CANCELADO: { rotulo: "Desistido", tom: "neutral" },
};
const ANDAMENTO = ["ENVIADO", "AGUARDANDO_APROVACAO", "AGENDADO"];

type Conta = { id: string; descricao: string; valor: number; valorPago: number; vencimento: string; status: string; fornecedor: { nome: string } | null };

/** Pagar uma conta a pagar pelo Inter (boleto ou PIX). Só o administrador manda. */
export function PagarInterModal({ conta, onClose }: { conta: Conta; onClose: () => void }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<"BOLETO" | "PIX">("BOLETO");
  const [destino, setDestino] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const lista = useQuery<{ data: PagamentoBanco[] }>({
    queryKey: ["pagamentos-banco", conta.id],
    queryFn: () => fetch(`/api/contas-pagar/${conta.id}/inter`).then((r) => r.json()),
  });
  const andamento = lista.data?.data.find((p) => ANDAMENTO.includes(p.status));
  const aberto = Math.round((conta.valor - conta.valorPago) * 100) / 100;

  async function chamar(url: string, metodo: string, corpo?: unknown) {
    setOcupado(true);
    setErro("");
    const r = await fetch(url, { method: metodo, headers: { "Content-Type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined });
    const j = await r.json().catch(() => ({}));
    setOcupado(false);
    qc.invalidateQueries({ queryKey: ["pagamentos-banco", conta.id] });
    qc.invalidateQueries({ queryKey: ["contas-pagar"] });
    if (!r.ok) setErro(j.error ?? "Não deu certo");
    return r.ok;
  }

  return (
    <Modal open onClose={onClose} title={`Pagar pelo Inter · ${conta.fornecedor?.nome ?? conta.descricao}`}>
      <div className="space-y-4 text-sm">
        <div className="text-gray-600">{conta.descricao} · vence {formatDate(conta.vencimento)} · em aberto <b>{formatCurrency(aberto)}</b></div>

        {andamento ? (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
            <Badge tone={SITUACAO_PAGAMENTO[andamento.status]?.tom ?? "neutral"}>{SITUACAO_PAGAMENTO[andamento.status]?.rotulo ?? andamento.status}</Badge>
            <p>{formatCurrency(andamento.valor)} por {andamento.tipo === "PIX" ? "PIX" : "boleto"} · {andamento.destino}</p>
            <p className="text-xs text-gray-600">
              A conta fica paga quando a saída aparecer no extrato do Inter. Se não for aprovar, recuse no app do Inter e clique em desistir.
            </p>
            <button className="btn-outline" disabled={ocupado} onClick={() => chamar(`/api/contas-pagar/pagamentos-banco/${andamento.id}`, "PATCH")}>Desistir deste pagamento</button>
          </div>
        ) : conta.status !== "PAGA" ? (
          <div className="space-y-2">
            <div className="flex gap-1">
              <button className={tipo === "BOLETO" ? "btn-primary !py-1" : "btn-outline !py-1"} onClick={() => setTipo("BOLETO")}>Boleto</button>
              <button className={tipo === "PIX" ? "btn-primary !py-1" : "btn-outline !py-1"} onClick={() => setTipo("PIX")}>PIX</button>
            </div>
            <label className="block">{tipo === "BOLETO" ? "Código de barras ou linha digitável" : "Chave PIX de quem vai receber"}
              <input className="input-verus font-mono" value={destino} onChange={(e) => { setDestino(e.target.value); setErro(""); }} />
            </label>
            <div className="border border-red-200 bg-red-50 rounded-lg p-3 text-red-800">
              Vai pedir ao banco para pagar <b>{formatCurrency(aberto)}</b>. Para confirmar, digite <b>PAGAR</b>:
              <input className="input-verus mt-1" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value.toUpperCase())} />
            </div>
            <button
              className="btn-primary"
              disabled={ocupado || confirmacao !== "PAGAR" || destino.trim().length < 5}
              onClick={async () => { if (await chamar(`/api/contas-pagar/${conta.id}/inter`, "POST", { tipo, destino, confirmacao })) setConfirmacao(""); }}
            >
              {ocupado ? "Mandando ao banco..." : "Mandar pagamento ao Inter"}
            </button>
          </div>
        ) : null}

        {erro && <p className="text-red-600">{erro}</p>}

        {!!lista.data?.data.filter((p) => p.id !== andamento?.id).length && (
          <div>
            <div className="text-xs text-gray-500 mb-1">Pedidos anteriores</div>
            {lista.data.data.filter((p) => p.id !== andamento?.id).map((p) => (
              <div key={p.id} className="text-xs text-gray-600 border-t border-gray-100 py-1">
                {formatDate(p.createdAt)} · {formatCurrency(p.valor)} · {p.tipo} · {SITUACAO_PAGAMENTO[p.status]?.rotulo ?? p.status}
                {p.status === "RECUSADO" && p.resposta && <div className="text-red-600 break-all">{p.resposta.slice(0, 200)}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
