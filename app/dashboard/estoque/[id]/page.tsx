"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpDown, Pencil } from "lucide-react";
import { useMaterial, useMovimentarMaterial } from "@/hooks/useMateriais";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { MovimentarModal } from "@/components/estoque/MovimentarModal";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Movimentacao = {
  id: string;
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  quantidade: number;
  custoUnit: number;
  observacao: string | null;
  createdAt: string;
  obra: { id: string; numero: string; nome: string } | null;
  user: { id: string; name: string } | null;
};

export default function MaterialDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: material, isLoading } = useMaterial(params.id);
  const movimentar = useMovimentarMaterial();
  const [open, setOpen] = useState(false);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!material) return <div className="text-gray-500">Material não encontrado.</div>;

  const baixo = material.estoqueAtual < material.estoqueMinimo;

  const dados = (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Field label="Categoria" value={material.categoria} />
        <Field label="Unidade" value={material.unidade} />
        <Field label="Estoque atual" value={`${material.estoqueAtual} ${material.unidade}`} />
        <Field label="Estoque mínimo" value={`${material.estoqueMinimo} ${material.unidade}`} />
        <Field label="Custo médio" value={formatCurrency(material.custoMedio)} />
        <Field label="Fornecedor padrão" value={material.fornecedorPadrao?.nome ?? "—"} />
      </div>
    </Card>
  );

  const movimentacoes = (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="table-impermeia">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Custo unit.</th>
              <th>Obra</th>
              <th>Usuário</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {material.movimentacoes.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-500 py-8">Sem movimentações.</td></tr>
            )}
            {material.movimentacoes.map((m: Movimentacao) => (
              <tr key={m.id}>
                <td>{formatDateTime(m.createdAt)}</td>
                <td>
                  <Badge tone={m.tipo === "ENTRADA" ? "green" : m.tipo === "SAIDA" ? "red" : "yellow"}>
                    {m.tipo}
                  </Badge>
                </td>
                <td className="tabular-nums">{m.quantidade} {material.unidade}</td>
                <td className="tabular-nums">{formatCurrency(m.custoUnit)}</td>
                <td className="text-sm">{m.obra ? `${m.obra.numero} · ${m.obra.nome}` : "—"}</td>
                <td className="text-sm text-gray-600">{m.user?.name ?? "—"}</td>
                <td className="text-sm text-gray-600">{m.observacao ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/estoque" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{material.nome}</h2>
          <p className="text-sm text-gray-500">
            {material.categoria} ·{" "}
            <Badge tone={baixo ? "red" : "neutral"}>
              {material.estoqueAtual} {material.unidade}
            </Badge>
          </p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-outline">
          <ArrowUpDown className="w-4 h-4" /> Movimentar
        </button>
        <Link href={`/dashboard/estoque/${material.id}/editar`} className="btn-outline">
          <Pencil className="w-4 h-4" /> Editar
        </Link>
      </div>

      <Tabs
        items={[
          { key: "dados", label: "Dados", content: dados },
          {
            key: "mov",
            label: `Movimentações (${material.movimentacoes.length})`,
            content: movimentacoes,
          },
        ]}
      />

      <MovimentarModal
        open={open}
        onClose={() => setOpen(false)}
        custoSugerido={material.custoMedio}
        unidade={material.unidade}
        submitting={movimentar.isPending}
        onSubmit={async (d) => {
          try {
            await movimentar.mutateAsync({ id: material.id, data: d });
            setOpen(false);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
