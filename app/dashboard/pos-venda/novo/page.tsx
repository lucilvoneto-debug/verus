"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateChamado } from "@/hooks/useChamados";

type GarantiaLite = {
  id: string;
  obra: { numero: string; nome: string };
  cliente: { id: string; nome: string };
};

type Tecnico = { id: string; nome: string; userId: string | null; funcao: string };

function NovoChamadoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const create = useCreateChamado();

  const [garantiaId, setGarantiaId] = useState(searchParams.get("garantiaId") ?? "");
  const [descricao, setDescricao] = useState("");
  const [fotosText, setFotosText] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: garantiasResp } = useQuery({
    queryKey: ["chamados", "garantias-ativas"],
    queryFn: async () => {
      const res = await fetch("/api/garantias?pageSize=500");
      if (!res.ok) throw new Error("Erro ao carregar garantias");
      return res.json();
    },
  });

  const { data: tecnicosResp } = useQuery({
    queryKey: ["chamados", "tecnicos"],
    queryFn: async () => {
      const res = await fetch("/api/colaboradores?funcoes=TECNICO,ENGENHEIRO");
      if (!res.ok) throw new Error("Erro ao carregar técnicos");
      return res.json();
    },
  });

  const garantias: GarantiaLite[] = garantiasResp?.data ?? [];
  const tecnicos: Tecnico[] = tecnicosResp?.data ?? [];

  const garantiaSelecionada = useMemo(
    () => garantias.find((g) => g.id === garantiaId),
    [garantias, garantiaId]
  );

  useEffect(() => {
    if (!garantiaId && garantias.length > 0) setGarantiaId(garantias[0].id);
  }, [garantias, garantiaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!garantiaSelecionada) {
      setError("Selecione uma garantia.");
      return;
    }
    setSubmitting(true);
    try {
      const fotos = fotosText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const tecnicoUserId =
        tecnicoId && tecnicos.find((t) => t.id === tecnicoId)?.userId;
      const c = await create.mutateAsync({
        garantiaId,
        clienteId: garantiaSelecionada.cliente.id,
        descricao,
        fotos,
        tecnicoId: tecnicoUserId || "",
        observacoes,
      });
      router.push(`/dashboard/pos-venda/${c.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar chamado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/pos-venda" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo chamado</h2>
          <p className="text-sm text-gray-500">Registre um novo chamado de assistência técnica.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="font-display text-lg font-semibold mb-4">Garantia & cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Garantia"
              value={garantiaId}
              onChange={(e) => setGarantiaId(e.target.value)}
              options={[
                { value: "", label: "Selecione..." },
                ...garantias.map((g) => ({
                  value: g.id,
                  label: `${g.obra.numero} — ${g.obra.nome} (${g.cliente.nome})`,
                })),
              ]}
            />
            <Input
              label="Cliente"
              value={garantiaSelecionada?.cliente.nome ?? ""}
              readOnly
              disabled
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold mb-4">Descrição & técnico</h3>
          <div className="space-y-4">
            <textarea
              rows={4}
              className="input-verus"
              placeholder="Descreva o problema relatado..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <Select
              label="Técnico responsável (opcional)"
              value={tecnicoId}
              onChange={(e) => setTecnicoId(e.target.value)}
              options={[
                { value: "", label: "Sem técnico" },
                ...tecnicos.map((t) => ({
                  value: t.id,
                  label: `${t.nome} (${t.funcao})`,
                })),
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fotos (URLs, uma por linha)
              </label>
              <textarea
                rows={3}
                className="input-verus"
                placeholder="https://..."
                value={fotosText}
                onChange={(e) => setFotosText(e.target.value)}
              />
            </div>
            <textarea
              rows={2}
              className="input-verus"
              placeholder="Observações internas..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
        </Card>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center justify-end gap-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Salvando..." : "Criar chamado"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="p-6 text-sm text-gray-500">Carregando...</div>}><NovoChamadoPageInner /></Suspense>; }
