"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NovoChamadoForm({
  garantias,
}: {
  garantias: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [garantiaId, setGarantiaId] = useState(garantias[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const fotosArr = fotos
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`/api/portal/chamados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garantiaId,
          descricao,
          fotos: fotosArr,
        }),
      });
      if (!res.ok) throw new Error("Falha");
      setFeedback({ type: "success", text: "Chamado aberto com sucesso." });
      setDescricao("");
      setFotos("");
      router.refresh();
    } catch {
      setFeedback({ type: "error", text: "Não foi possível abrir o chamado." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Garantia</label>
        <select
          value={garantiaId}
          onChange={(e) => setGarantiaId(e.target.value)}
          className="input-verus"
          required
        >
          {garantias.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          className="input-verus"
          required
          placeholder="Descreva o problema observado"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URLs de fotos (uma por linha)
        </label>
        <textarea
          value={fotos}
          onChange={(e) => setFotos(e.target.value)}
          rows={3}
          className="input-verus"
          placeholder="https://..."
        />
      </div>
      {feedback && (
        <p
          className={`text-sm ${
            feedback.type === "success" ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {feedback.text}
        </p>
      )}
      <button
        type="submit"
        className="btn-primary w-full justify-center"
        disabled={loading || !descricao.trim() || !garantiaId}
      >
        {loading ? "Enviando..." : "Abrir chamado"}
      </button>
    </form>
  );
}
