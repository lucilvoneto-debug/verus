"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Trash2, ImagePlus, Camera } from "lucide-react";

type EtapaData = {
  id: string;
  obraId: string;
  ordem: number;
  nome: string;
  descricao: string;
  responsavelId: string;
  dataPrevista: string;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA";
  observacoes: string;
  checklist: { nome: string; done: boolean }[];
  fotos: string[];
};

export function CampoEtapaForm({ etapa }: { etapa: EtapaData }) {
  const router = useRouter();
  const [checklist, setChecklist] = useState(etapa.checklist || []);
  const [fotos, setFotos] = useState<string[]>(etapa.fotos || []);
  const [novaFoto, setNovaFoto] = useState("");
  const [novoItem, setNovoItem] = useState("");
  const [observacoes, setObservacoes] = useState(etapa.observacoes || "");
  const [saving, setSaving] = useState(false);

  const todoConcluido =
    checklist.length > 0 && checklist.every((c) => c.done);

  const persist = async (data: Partial<EtapaData>) => {
    const payload = {
      obraId: etapa.obraId,
      ordem: etapa.ordem,
      nome: etapa.nome,
      descricao: etapa.descricao,
      responsavelId: etapa.responsavelId,
      dataPrevista: etapa.dataPrevista,
      status: etapa.status,
      observacoes,
      checklist,
      fotos,
      ...data,
    };
    const res = await fetch(`/api/etapas/${etapa.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Erro ao salvar etapa");
    }
  };

  const toggleItem = async (idx: number) => {
    const next = checklist.map((c, i) => (i === idx ? { ...c, done: !c.done } : c));
    setChecklist(next);
    try {
      setSaving(true);
      await persist({ checklist: next });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (!novoItem.trim()) return;
    setChecklist([...checklist, { nome: novoItem.trim(), done: false }]);
    setNovoItem("");
  };

  const removeItem = (idx: number) => {
    setChecklist(checklist.filter((_, i) => i !== idx));
  };

  const addFoto = () => {
    if (!novaFoto.trim()) return;
    setFotos([...fotos, novaFoto.trim()]);
    setNovaFoto("");
  };

  const removeFoto = (idx: number) => {
    setFotos(fotos.filter((_, i) => i !== idx));
  };

  const salvar = async () => {
    setSaving(true);
    try {
      await persist({});
      router.refresh();
      alert("Salvo!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  const concluir = async () => {
    if (!confirm("Marcar etapa como concluída?")) return;
    setSaving(true);
    try {
      await persist({ status: "CONCLUIDA" });
      router.push(`/campo/obras/${etapa.obraId}`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">Checklist</h2>
          <span className="text-xs text-gray-500">
            {checklist.filter((c) => c.done).length}/{checklist.length}
          </span>
        </div>
        {checklist.length === 0 && (
          <p className="text-sm text-gray-500 mb-3">Sem itens. Adicione abaixo.</p>
        )}
        <ul className="space-y-2 mb-3">
          {checklist.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center gap-3 px-3 py-3 rounded-lg border border-gray-200 bg-white"
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(idx)}
                className="w-5 h-5 rounded text-brand focus:ring-brand"
              />
              <span
                className={`flex-1 text-sm ${
                  item.done ? "line-through text-gray-400" : "text-gray-800"
                }`}
              >
                {item.nome}
              </span>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="p-2 text-gray-400 hover:text-danger min-h-10 min-w-10"
                aria-label="Remover item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            placeholder="Novo item de checklist"
            className="input-verus flex-1 min-h-12 text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addItem();
              }
            }}
          />
          <button
            type="button"
            onClick={addItem}
            className="btn-outline min-h-12"
            aria-label="Adicionar"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Fotos</h2>
        {fotos.length === 0 && (
          <p className="text-sm text-gray-500 mb-3">Nenhuma foto anexada.</p>
        )}
        <ul className="grid grid-cols-3 gap-2 mb-3">
          {fotos.map((url, idx) => (
            <li key={idx} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-full aspect-square object-cover rounded-lg border border-gray-200 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => removeFoto(idx)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
                aria-label="Remover foto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={novaFoto}
            onChange={(e) => setNovaFoto(e.target.value)}
            placeholder="URL da foto"
            className="input-verus flex-1 min-h-12 text-base"
          />
          <button
            type="button"
            onClick={addFoto}
            className="btn-outline min-h-12"
            aria-label="Adicionar"
          >
            <ImagePlus className="w-4 h-4" />
          </button>
        </div>
        <label className="mt-2 flex items-center justify-center gap-2 text-sm text-brand min-h-12 border border-dashed border-gray-300 rounded-lg">
          <Camera className="w-4 h-4" />
          <span>Tirar foto (em breve)</span>
          <input type="file" accept="image/*" capture="environment" className="hidden" />
        </label>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Observações</h2>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          className="input-verus text-base"
          placeholder="Notas livres sobre a etapa"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={salvar}
          disabled={saving}
          className="btn-outline min-h-14 text-base"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={concluir}
          disabled={saving || etapa.status === "CONCLUIDA"}
          className="inline-flex items-center justify-center gap-2 bg-success hover:bg-emerald-600 text-white font-semibold rounded-lg min-h-14 text-base disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          {etapa.status === "CONCLUIDA"
            ? "Etapa concluída"
            : todoConcluido
              ? "Marcar como concluída"
              : "Concluir mesmo assim"}
        </button>
      </div>
    </div>
  );
}
