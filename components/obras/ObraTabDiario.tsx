"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/utils";
import { useCreateDiario } from "@/hooks/useObras";

type Diario = {
  id: string;
  data: string;
  descricao: string;
  condicaoTempo: string | null;
  problemas: string | null;
  autor: { id: string; name: string } | null;
};

export function ObraTabDiario({ obraId, diarios }: { obraId: string; diarios: Diario[] }) {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [descricao, setDescricao] = useState("");
  const [condicaoTempo, setCondicaoTempo] = useState("");
  const [problemas, setProblemas] = useState("");
  const create = useCreateDiario(obraId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({ data, descricao, condicaoTempo, problemas });
      setDescricao("");
      setCondicaoTempo("");
      setProblemas("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Nova entrada de diário</h3>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
          />
          <Input
            label="Condição do tempo"
            placeholder="Ex.: Ensolarado"
            value={condicaoTempo}
            onChange={(e) => setCondicaoTempo(e.target.value)}
          />
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              className="input-impermeia"
              rows={3}
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700">Problemas</label>
            <textarea
              className="input-impermeia"
              rows={2}
              value={problemas}
              onChange={(e) => setProblemas(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={create.isPending} className="btn-primary">
              {create.isPending ? "Salvando..." : "Adicionar entrada"}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Histórico</h3>
        {diarios.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum registro.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {diarios.map((d) => (
              <li key={d.id} className="py-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{formatDate(d.data)}</span>
                  {d.condicaoTempo && (
                    <span className="text-gray-500">· {d.condicaoTempo}</span>
                  )}
                  {d.autor && (
                    <span className="text-xs text-gray-500 ml-auto">por {d.autor.name}</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{d.descricao}</p>
                {d.problemas && (
                  <p className="text-sm text-red-600 mt-1">
                    <span className="font-medium">Problemas:</span> {d.problemas}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
