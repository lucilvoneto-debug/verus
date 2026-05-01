"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Pencil, LogIn, LogOut, FileText } from "lucide-react";
import {
  useVisita,
  useUpdateVisita,
  useVisitaCheckIn,
  useVisitaCheckOut,
} from "@/hooks/useVisitas";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { formatDateTime, formatDate } from "@/lib/utils";

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  AGENDADA: "blue",
  EM_ANDAMENTO: "yellow",
  CONCLUIDA: "green",
  CANCELADA: "red",
};

export default function VisitaDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: visita, isLoading } = useVisita(params.id);
  const checkIn = useVisitaCheckIn(params.id);
  const checkOut = useVisitaCheckOut(params.id);
  const update = useUpdateVisita(params.id);

  const [diagnostico, setDiagnostico] = useState("");
  const [tipoSuperficie, setTipoSuperficie] = useState("");
  const [causaProvavel, setCausaProvavel] = useState("");
  const [solucaoRecomendada, setSolucaoRecomendada] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [fotosUrls, setFotosUrls] = useState<string[]>([]);
  const [novaFotoUrl, setNovaFotoUrl] = useState("");

  useEffect(() => {
    if (visita) {
      setDiagnostico(visita.diagnostico ?? "");
      setTipoSuperficie(visita.tipoSuperficie ?? "");
      setCausaProvavel(visita.causaProvavel ?? "");
      setSolucaoRecomendada(visita.solucaoRecomendada ?? "");
      try {
        const m = visita.medidas ? JSON.parse(visita.medidas) : null;
        setAreaM2(m?.areaM2 != null ? String(m.areaM2) : "");
      } catch {
        setAreaM2("");
      }
      try {
        const f = visita.fotos ? JSON.parse(visita.fotos) : [];
        setFotosUrls(Array.isArray(f) ? f : []);
      } catch {
        setFotosUrls([]);
      }
    }
  }, [visita]);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!visita) return <div className="text-gray-500">Visita não encontrada.</div>;

  async function handleSalvarDiagnostico() {
    try {
      await update.mutateAsync({
        clienteId: visita.clienteId,
        tecnicoId: visita.tecnicoId,
        endereco: visita.endereco,
        dataAgendada: new Date(visita.dataAgendada).toISOString(),
        observacoes: visita.observacoes ?? "",
        diagnostico,
        tipoSuperficie,
        causaProvavel,
        solucaoRecomendada,
        medidas: areaM2 ? JSON.stringify({ areaM2: Number(areaM2) }) : "",
        fotos: JSON.stringify(fotosUrls),
      });
      alert("Diagnóstico salvo!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleCheckIn() {
    try {
      await checkIn.mutateAsync();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleCheckOut() {
    try {
      await checkOut.mutateAsync();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  function handleAddFoto() {
    if (!novaFotoUrl.trim()) return;
    setFotosUrls((f) => [...f, novaFotoUrl.trim()]);
    setNovaFotoUrl("");
  }

  function handleRemoveFoto(idx: number) {
    setFotosUrls((f) => f.filter((_, i) => i !== idx));
  }

  const dados = (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Field label="Cliente" value={visita.cliente?.nome ?? "—"} />
        <Field label="Técnico" value={visita.tecnico?.name ?? "—"} />
        <Field label="Data agendada" value={formatDateTime(visita.dataAgendada)} />
        <Field
          label="Status"
          value={(visita.status as string).replace("_", " ")}
        />
        <Field
          label="Check-in"
          value={visita.dataCheckIn ? formatDateTime(visita.dataCheckIn) : "—"}
        />
        <Field
          label="Check-out"
          value={visita.dataCheckOut ? formatDateTime(visita.dataCheckOut) : "—"}
        />
        <Field label="Endereço" value={visita.endereco} />
        <Field label="Cadastrada em" value={formatDate(visita.createdAt)} />
      </div>
      {visita.observacoes && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Observações</div>
          <p className="text-sm whitespace-pre-wrap">{visita.observacoes}</p>
        </div>
      )}
    </Card>
  );

  const diagnosticoTab = (
    <div className="space-y-4">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Diagnóstico técnico</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Tipo de superfície</label>
            <input
              className="input-verus"
              value={tipoSuperficie}
              onChange={(e) => setTipoSuperficie(e.target.value)}
              placeholder="Laje, telhado, cobertura..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Área (m²)</label>
            <input
              type="number"
              step="0.01"
              className="input-verus"
              value={areaM2}
              onChange={(e) => setAreaM2(e.target.value)}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Causa provável</label>
            <textarea
              rows={2}
              className="input-verus"
              value={causaProvavel}
              onChange={(e) => setCausaProvavel(e.target.value)}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Solução recomendada
            </label>
            <textarea
              rows={3}
              className="input-verus"
              value={solucaoRecomendada}
              onChange={(e) => setSolucaoRecomendada(e.target.value)}
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Diagnóstico geral</label>
            <textarea
              rows={3}
              className="input-verus"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSalvarDiagnostico}
            disabled={update.isPending}
            className="btn-primary"
          >
            {update.isPending ? "Salvando..." : "Salvar diagnóstico"}
          </button>
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Fotos</h3>
        <div className="flex gap-2 mb-3">
          <input
            className="input-verus flex-1"
            placeholder="URL da foto..."
            value={novaFotoUrl}
            onChange={(e) => setNovaFotoUrl(e.target.value)}
          />
          <button onClick={handleAddFoto} className="btn-outline">
            Adicionar
          </button>
        </div>
        {fotosUrls.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma foto adicionada.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {fotosUrls.map((url, idx) => (
              <li
                key={idx}
                className="border border-gray-200 rounded p-2 text-xs flex items-center gap-2"
              >
                <span className="flex-1 truncate">{url}</span>
                <button
                  onClick={() => handleRemoveFoto(idx)}
                  className="text-red-600 hover:underline"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Salve o diagnóstico para persistir as fotos.
        </p>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/visita" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            Visita · {visita.cliente?.nome}
          </h2>
          <p className="text-sm text-gray-500">
            {formatDateTime(visita.dataAgendada)} ·{" "}
            <Badge tone={statusTone[visita.status as string] ?? "neutral"}>
              {(visita.status as string).replace("_", " ")}
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!visita.dataCheckIn && (
            <button onClick={handleCheckIn} disabled={checkIn.isPending} className="btn-outline">
              <LogIn className="w-4 h-4" /> Check-in
            </button>
          )}
          {visita.dataCheckIn && !visita.dataCheckOut && (
            <button
              onClick={handleCheckOut}
              disabled={checkOut.isPending}
              className="btn-outline"
            >
              <LogOut className="w-4 h-4" /> Check-out
            </button>
          )}
          <Link href={`/dashboard/visita/${visita.id}/editar`} className="btn-outline">
            <Pencil className="w-4 h-4" /> Editar
          </Link>
          <button
            onClick={() =>
              router.push(
                `/dashboard/orcamento/novo?visitaId=${visita.id}&clienteId=${visita.clienteId}`
              )
            }
            className="btn-primary"
          >
            <FileText className="w-4 h-4" /> Gerar orçamento
          </button>
        </div>
      </div>

      <Tabs
        items={[
          { key: "dados", label: "Dados", content: dados },
          { key: "diag", label: "Diagnóstico", content: diagnosticoTab },
        ]}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
