"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";

export function OrcamentoActions({ orcamentoId }: { orcamentoId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAjuste, setShowAjuste] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function aprovar() {
    if (!confirm("Confirmar aprovação online deste orçamento?")) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/portal/orcamentos/${orcamentoId}/aprovar`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao aprovar");
      setFeedback({ type: "success", text: "Orçamento aprovado!" });
      router.refresh();
    } catch {
      setFeedback({ type: "error", text: "Não foi possível aprovar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  async function enviarAjuste() {
    if (!mensagem.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/portal/orcamentos/${orcamentoId}/ajuste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem }),
      });
      if (!res.ok) throw new Error("Falha");
      setFeedback({ type: "success", text: "Solicitação enviada à equipe comercial." });
      setMensagem("");
      setShowAjuste(false);
    } catch {
      setFeedback({ type: "error", text: "Não foi possível enviar. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      {feedback && (
        <div
          className={`mb-3 text-sm ${
            feedback.type === "success" ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={aprovar}
          disabled={loading}
          className="btn-primary justify-center"
        >
          Aprovar online
        </button>
        <button
          type="button"
          onClick={() => setShowAjuste((s) => !s)}
          disabled={loading}
          className="btn-outline justify-center"
        >
          {showAjuste ? "Cancelar" : "Solicitar ajuste"}
        </button>
      </div>
      {showAjuste && (
        <div className="mt-3 space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Descreva o ajuste desejado
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={4}
            className="input-verus"
            placeholder="Ex.: Gostaria de remover o item X ou rever a condição de pagamento..."
          />
          <button
            type="button"
            onClick={enviarAjuste}
            disabled={loading || !mensagem.trim()}
            className="btn-primary w-full justify-center"
          >
            Enviar solicitação
          </button>
        </div>
      )}
    </Card>
  );
}
