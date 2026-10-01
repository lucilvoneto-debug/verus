"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { CATEGORIAS_CAIXA, CATEGORIA_LABEL } from "@/lib/caixa/validacoes";

type Opcao = { id: string; nome: string };

async function lista(url: string, chave: string): Promise<Opcao[]> {
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = await r.json();
  return (j[chave] ?? []) as Opcao[];
}

/** Formulário único de lançamento: serve para extrato, retirada e aporte de sócio. */
export function LancamentoModal({
  open,
  onClose,
  onSalvo,
  inicial,
}: {
  open: boolean;
  onClose: () => void;
  onSalvo: () => void;
  inicial?: Partial<Record<string, string>>;
}) {
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Maceio" });
  const [f, setF] = useState<Record<string, string>>({ data: hoje, tipo: "SAIDA", categoria: "MATERIAL", ...inicial });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const contas = useQuery({ queryKey: ["opc-contas"], queryFn: () => lista("/api/contas-financeiras", "contas"), enabled: open });
  const socios = useQuery({ queryKey: ["opc-socios"], queryFn: () => lista("/api/socios", "socios"), enabled: open });
  const obras = useQuery({ queryKey: ["opc-obras"], queryFn: () => lista("/api/obras?pageSize=100", "data"), enabled: open });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF((v) => ({ ...v, [k]: e.target.value }));
    setErro("");
  };

  async function salvar() {
    if (!f.valor || Number(f.valor) <= 0) return setErro("Informe um valor maior que zero.");
    if (!f.descricao?.trim()) return setErro("Escreva uma descrição.");
    setSalvando(true);
    const r = await fetch("/api/lancamentos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...f, valor: Number(f.valor) }),
    });
    setSalvando(false);
    if (!r.ok) return setErro("Não salvou. Confira os campos e tente de novo.");
    onSalvo();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo lançamento">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="col-span-1">Data<input type="date" className="input-verus" value={f.data} onChange={set("data")} /></label>
        <label className="col-span-1">Entrou ou saiu
          <select className="input-verus" value={f.tipo} onChange={set("tipo")}>
            <option value="SAIDA">Saiu dinheiro</option>
            <option value="ENTRADA">Entrou dinheiro</option>
          </select>
        </label>
        <label className="col-span-1">Valor (R$)<input type="number" step="0.01" min="0" className="input-verus" value={f.valor ?? ""} onChange={set("valor")} /></label>
        <label className="col-span-1">Categoria
          <select className="input-verus" value={f.categoria} onChange={set("categoria")}>
            {CATEGORIAS_CAIXA.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
          </select>
        </label>
        <label className="col-span-2">Descrição<input className="input-verus" value={f.descricao ?? ""} onChange={set("descricao")} placeholder="Ajudante William, gás, 1ª parcela Green Park..." /></label>
        <label className="col-span-1">Conta
          <select className="input-verus" value={f.contaId ?? ""} onChange={set("contaId")}>
            <option value="">—</option>
            {contas.data?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <label className="col-span-1">Sócio
          <select className="input-verus" value={f.socioId ?? ""} onChange={set("socioId")}>
            <option value="">—</option>
            {socios.data?.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </label>
        <label className="col-span-1">Obra
          <select className="input-verus" value={f.obraId ?? ""} onChange={set("obraId")}>
            <option value="">—</option>
            {obras.data?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </label>
        <label className="col-span-1">Quem recebeu / pagou<input className="input-verus" value={f.favorecido ?? ""} onChange={set("favorecido")} /></label>
        <label className="col-span-2">Observações<textarea className="input-verus" rows={2} value={f.observacoes ?? ""} onChange={set("observacoes")} /></label>
      </div>
      {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn-primary" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</button>
      </div>
    </Modal>
  );
}
