"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import { useCreateAlocacao, useDeleteAlocacao } from "@/hooks/useObras";
import { useQuery } from "@tanstack/react-query";

type Alocacao = {
  id: string;
  papel: string;
  dataInicio: string;
  dataFim: string | null;
  colaborador: { id: string; nome: string; funcao: string };
};

function useAllColaboradores() {
  return useQuery<{ data: { id: string; nome: string; funcao: string }[] }>({
    queryKey: ["colaboradores", "all"],
    queryFn: async () => {
      const res = await fetch("/api/colaboradores");
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });
}

export function ObraTabEquipe({ obraId, alocacoes }: { obraId: string; alocacoes: Alocacao[] }) {
  const [colaboradorId, setColaboradorId] = useState("");
  const [papel, setPapel] = useState("");
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState("");

  const colabs = useAllColaboradores();
  const create = useCreateAlocacao(obraId);
  const del = useDeleteAlocacao(obraId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({ colaboradorId, papel, dataInicio, dataFim });
      setColaboradorId("");
      setPapel("");
      setDataFim("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    }
  }

  async function handleRemove(id: string, nome: string) {
    if (!confirm(`Remover alocação de ${nome}?`)) return;
    try {
      await del.mutateAsync(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  const colabOpts = [
    { value: "", label: "Selecione..." },
    ...(colabs.data?.data.map((c) => ({
      value: c.id,
      label: `${c.nome} · ${c.funcao}`,
    })) ?? []),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Adicionar colaborador</h3>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Colaborador"
            options={colabOpts}
            value={colaboradorId}
            onChange={(e) => setColaboradorId(e.target.value)}
            className="md:col-span-2"
          />
          <Input
            label="Papel"
            placeholder="Ex.: Aplicador líder"
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
            required
          />
          <div />
          <Input
            label="Data início"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required
          />
          <Input
            label="Data fim (opcional)"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
          <div className="md:col-span-2 flex justify-end items-end">
            <button type="submit" disabled={create.isPending || !colaboradorId} className="btn-primary">
              {create.isPending ? "Salvando..." : "Alocar"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="p-0">
        <table className="table-impermeia">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Função</th>
              <th>Papel</th>
              <th>Início</th>
              <th>Fim</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {alocacoes.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-8">
                  Nenhum colaborador alocado.
                </td>
              </tr>
            )}
            {alocacoes.map((a) => (
              <tr key={a.id}>
                <td className="font-medium">{a.colaborador.nome}</td>
                <td>{a.colaborador.funcao}</td>
                <td>{a.papel}</td>
                <td>{formatDate(a.dataInicio)}</td>
                <td>{a.dataFim ? formatDate(a.dataFim) : "—"}</td>
                <td className="text-right pr-4">
                  <button
                    onClick={() => handleRemove(a.id, a.colaborador.nome)}
                    className="p-2 rounded hover:bg-red-50 text-red-600"
                    aria-label="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
