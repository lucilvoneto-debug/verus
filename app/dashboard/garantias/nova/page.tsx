"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateGarantia, useObrasDisponiveis } from "@/hooks/useGarantias";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsIso(baseIso: string, months: number): string {
  const d = new Date(baseIso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function NovaGarantiaPage() {
  const router = useRouter();
  const create = useCreateGarantia();
  const { data: obrasData } = useObrasDisponiveis();

  const [obraId, setObraId] = useState("");
  const [dataInicio, setDataInicio] = useState(todayIso());
  const [prazoMeses, setPrazoMeses] = useState(60);
  const [tipoGarantia, setTipoGarantia] = useState("Manta asfáltica - 5 anos");
  const [condicoes, setCondicoes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obras: Array<{
    id: string;
    numero: string;
    nome: string;
    cliente: { id: string; nome: string };
  }> = obrasData?.data ?? [];

  const obraSelecionada = useMemo(
    () => obras.find((o) => o.id === obraId),
    [obras, obraId]
  );

  const dataFim = useMemo(
    () => addMonthsIso(dataInicio, prazoMeses),
    [dataInicio, prazoMeses]
  );

  useEffect(() => {
    if (!obraId && obras.length > 0) setObraId(obras[0].id);
  }, [obras, obraId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!obraSelecionada) {
      setError("Selecione uma obra.");
      return;
    }
    setSubmitting(true);
    try {
      const g = await create.mutateAsync({
        obraId,
        clienteId: obraSelecionada.cliente.id,
        dataInicio,
        dataFim,
        prazoMeses,
        tipoGarantia,
        condicoes,
        status: "ATIVA",
      });
      router.push(`/dashboard/garantias/${g.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar garantia");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/garantias" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Nova garantia</h2>
          <p className="text-sm text-gray-500">Cadastre uma garantia para uma obra finalizada.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <h3 className="font-display text-lg font-semibold mb-4">Obra & cliente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Obra finalizada"
              value={obraId}
              onChange={(e) => setObraId(e.target.value)}
              options={[
                { value: "", label: "Selecione..." },
                ...obras.map((o) => ({
                  value: o.id,
                  label: `${o.numero} — ${o.nome}`,
                })),
              ]}
            />
            <Input
              label="Cliente"
              value={obraSelecionada?.cliente.nome ?? ""}
              readOnly
              disabled
            />
          </div>
          {obras.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">
              Nenhuma obra finalizada disponível para garantia.
            </p>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold mb-4">Prazo & tipo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Data de início"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
            <Input
              label="Prazo (meses)"
              type="number"
              min={1}
              value={prazoMeses}
              onChange={(e) => setPrazoMeses(Number(e.target.value))}
            />
            <Input label="Data de fim (calculada)" type="date" value={dataFim} readOnly disabled />
            <Input
              label="Tipo de garantia"
              value={tipoGarantia}
              onChange={(e) => setTipoGarantia(e.target.value)}
              className="md:col-span-3"
            />
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold mb-4">Condições</h3>
          <textarea
            rows={5}
            className="input-verus"
            placeholder="Condições da garantia, exclusões, manutenção obrigatória..."
            value={condicoes}
            onChange={(e) => setCondicoes(e.target.value)}
          />
        </Card>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex items-center justify-end gap-2">
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Salvando..." : "Criar garantia"}
          </button>
        </div>
      </form>
    </div>
  );
}
