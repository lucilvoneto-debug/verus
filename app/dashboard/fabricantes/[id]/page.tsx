"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil, FileCheck2, ExternalLink } from "lucide-react";
import { useFabricante } from "@/hooks/useFabricantes";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
  custoMedio: number;
  estoqueAtual: number;
  ativo: boolean;
};

export default function FabricanteDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: fabricante, isLoading } = useFabricante(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!fabricante) return <div className="text-gray-500">Fabricante não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/fabricantes" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{fabricante.nome}</h2>
          <p className="text-sm text-gray-500">
            {fabricante._count?.produtos ?? 0} produto(s) cadastrado(s)
          </p>
        </div>
        <Badge tone={fabricante.ativo ? "green" : "neutral"}>
          {fabricante.ativo ? "Ativo" : "Inativo"}
        </Badge>
        <Link href={`/dashboard/fabricantes/${fabricante.id}/editar`} className="btn-outline">
          <Pencil className="w-4 h-4" /> Editar
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field
            label="Catálogo"
            value={
              <Badge tone={fabricante.catalogoSincronizado ? "blue" : "yellow"}>
                {fabricante.catalogoSincronizado ? "Sincronizado" : "Pendente"}
              </Badge>
            }
          />
          <Field
            label="Garantia padrão"
            value={fabricante.garantiaAnosPadrao ? `${fabricante.garantiaAnosPadrao} anos` : "—"}
          />
          <Field label="Normas técnicas" value={fabricante.normasTecnicas ?? "—"} />
          <Field
            label="FISPQ"
            value={
              fabricante.fispqUrl ? (
                <a
                  href={fabricante.fispqUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline inline-flex items-center gap-1"
                >
                  <FileCheck2 className="w-3.5 h-3.5" /> Abrir <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <Field
            label="Ficha técnica"
            value={
              fabricante.fichaTecnicaUrl ? (
                <a
                  href={fabricante.fichaTecnicaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline inline-flex items-center gap-1"
                >
                  Abrir <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                "—"
              )
            }
          />
          <Field label="Observações" value={fabricante.observacoes ?? "—"} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="px-5 pt-5">
          <h3 className="font-display text-lg font-semibold text-brand-dark">Produtos</h3>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Unidade</th>
                <th>Estoque</th>
                <th>Custo médio</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(fabricante.produtos?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhum produto vinculado a este fabricante.
                  </td>
                </tr>
              )}
              {fabricante.produtos?.map((p: Produto) => (
                <tr key={p.id}>
                  <td className="font-medium">
                    <Link href={`/dashboard/estoque/${p.id}`} className="hover:text-brand hover:underline">
                      {p.nome}
                    </Link>
                  </td>
                  <td><Badge tone="neutral">{p.categoria}</Badge></td>
                  <td>{p.unidade}</td>
                  <td className="tabular-nums">{p.estoqueAtual} {p.unidade}</td>
                  <td className="tabular-nums">{formatCurrency(p.custoMedio)}</td>
                  <td>
                    <Badge tone={p.ativo ? "green" : "neutral"}>{p.ativo ? "Ativo" : "Inativo"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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
