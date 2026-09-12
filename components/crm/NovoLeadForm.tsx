"use client";

import { useState } from "react";
import { ORIGENS } from "@/lib/crm/leads";

export function NovoLeadForm({
  usuarios,
  onDone,
}: {
  usuarios: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [f, setF] = useState({
    nome: "", telefone: "", email: "", cidade: "Maceió", bairro: "", tipoImovel: "RESIDENCIAL",
    origem: "MANUAL", descricao: "", urgencia: "MEDIA", valorEstimado: "", responsavelId: "",
  });
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, valorEstimado: f.valorEstimado ? Number(f.valorEstimado) : undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Erro ao salvar");
      onDone();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm col-span-2">Nome<input className="input-verus mt-1" required value={f.nome} onChange={set("nome")} /></label>
        <label className="text-sm">Telefone/WhatsApp<input className="input-verus mt-1" value={f.telefone} onChange={set("telefone")} placeholder="82 9xxxx-xxxx" /></label>
        <label className="text-sm">E-mail<input className="input-verus mt-1" type="email" value={f.email} onChange={set("email")} /></label>
        <label className="text-sm">Cidade<input className="input-verus mt-1" value={f.cidade} onChange={set("cidade")} /></label>
        <label className="text-sm">Bairro<input className="input-verus mt-1" value={f.bairro} onChange={set("bairro")} /></label>
        <label className="text-sm">Tipo de imóvel
          <select className="input-verus mt-1" value={f.tipoImovel} onChange={set("tipoImovel")}>
            {["RESIDENCIAL", "CONDOMINIO", "COMERCIAL", "INDUSTRIA", "OBRA"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm">Origem
          <select className="input-verus mt-1" value={f.origem} onChange={set("origem")}>
            {Object.entries(ORIGENS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-sm">Urgência
          <select className="input-verus mt-1" value={f.urgencia} onChange={set("urgencia")}>
            <option value="BAIXA">Baixa</option><option value="MEDIA">Média</option><option value="ALTA">Alta</option>
          </select>
        </label>
        <label className="text-sm">Valor estimado (R$)<input className="input-verus mt-1" type="number" min={0} step="0.01" value={f.valorEstimado} onChange={set("valorEstimado")} /></label>
        <label className="text-sm col-span-2">Responsável
          <select className="input-verus mt-1" value={f.responsavelId} onChange={set("responsavelId")}>
            <option value="">Eu mesmo</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="text-sm col-span-2">O que o cliente precisa
          <textarea className="input-verus mt-1" rows={3} required value={f.descricao} onChange={set("descricao")} placeholder="Ex.: infiltração na laje da cobertura, 80 m²" />
        </label>
      </div>
      {erro && <p className="text-sm text-danger">{erro}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="submit" className="btn-primary" disabled={salvando}>{salvando ? "Salvando…" : "Salvar lead"}</button>
      </div>
    </form>
  );
}
