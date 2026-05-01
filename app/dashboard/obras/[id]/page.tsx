"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { useObra } from "@/hooks/useObras";
import { Tabs } from "@/components/ui/Tabs";
import { ObraTabDados } from "@/components/obras/ObraTabDados";
import { ObraTabCronograma } from "@/components/obras/ObraTabCronograma";
import { ObraTabDiario } from "@/components/obras/ObraTabDiario";
import { ObraTabEquipe } from "@/components/obras/ObraTabEquipe";
import { ObraTabMedicoes } from "@/components/obras/ObraTabMedicoes";
import { ObraTabCustos } from "@/components/obras/ObraTabCustos";
import { ObraTabFotos } from "@/components/obras/ObraTabFotos";

export default function ObraDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: obra, isLoading } = useObra(params.id);

  async function emitirNF() {
    if (!obra) return;
    if (!confirm("Emitir nota fiscal para esta obra?")) return;
    try {
      const res = await fetch("/api/integracoes/nfe/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obraId: obra.id }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        alert(json.error ?? "Erro ao emitir NF.");
        return;
      }
      const prefixo = json.mock ? "[mock] " : "";
      alert(`${prefixo}NF ${json.numero ?? ""} emitida.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!obra) return <div className="text-gray-500">Obra não encontrada.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/obras" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            {obra.numero} · {obra.nome}
          </h2>
          <p className="text-sm text-gray-500">{obra.cliente.nome}</p>
        </div>
        <button onClick={emitirNF} className="btn-outline">
          <FileText className="w-4 h-4" /> Emitir NF
        </button>
      </div>

      <Tabs
        items={[
          { key: "dados", label: "Dados", content: <ObraTabDados obra={obra} /> },
          {
            key: "cron",
            label: `Cronograma (${obra.totalEtapas})`,
            content: <ObraTabCronograma obraId={obra.id} etapas={obra.etapas} />,
          },
          {
            key: "diario",
            label: `Diário (${obra.diarios.length})`,
            content: <ObraTabDiario obraId={obra.id} diarios={obra.diarios} />,
          },
          {
            key: "equipe",
            label: `Equipe (${obra.alocacoes.length})`,
            content: <ObraTabEquipe obraId={obra.id} alocacoes={obra.alocacoes} />,
          },
          {
            key: "medicoes",
            label: `Medições (${obra.medicoes.length})`,
            content: <ObraTabMedicoes obraId={obra.id} medicoes={obra.medicoes} />,
          },
          {
            key: "custos",
            label: "Custos",
            content: (
              <ObraTabCustos
                movimentacoes={obra.movimentacoes}
                valorContrato={obra.valorContrato}
                custoMateriais={obra.custoMateriais}
                custoEquipe={obra.custoEquipe}
                custoTotal={obra.custoTotal}
                margemReal={obra.margemReal}
              />
            ),
          },
          {
            key: "fotos",
            label: `Fotos (${obra.fotos.length})`,
            content: <ObraTabFotos fotos={obra.fotos} />,
          },
        ]}
      />
    </div>
  );
}
