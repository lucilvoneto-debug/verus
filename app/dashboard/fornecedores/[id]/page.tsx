"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { useFornecedor } from "@/hooks/useFornecedores";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { formatCNPJ, formatCurrency, formatDate } from "@/lib/utils";

const statusTone = (s: string) =>
  s === "RECEBIDO" ? "green" : s === "ENVIADO" ? "blue" : s === "CANCELADO" ? "red" : "neutral";

export default function FornecedorDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: f, isLoading } = useFornecedor(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!f) return <div className="text-gray-500">Fornecedor não encontrado.</div>;

  const dados = (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Field label="CNPJ" value={formatCNPJ(f.cnpj)} />
        <Field label="Contato" value={f.contato ?? "—"} />
        <Field label="E-mail" value={f.email ?? "—"} />
        <Field label="Telefone" value={f.telefone ?? "—"} />
        <Field label="Endereço" value={f.endereco ?? "—"} />
        <Field label="Status" value={f.ativo ? "Ativo" : "Inativo"} />
      </div>
      {f.observacoes && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Observações</div>
          <p className="text-sm whitespace-pre-wrap">{f.observacoes}</p>
        </div>
      )}
    </Card>
  );

  const pedidos = (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="table-verus">
          <thead>
            <tr>
              <th>Número</th>
              <th>Data</th>
              <th>Previsão</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {f.pedidos.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-500 py-8">Nenhum pedido.</td></tr>
            )}
            {f.pedidos.map((p: { id: string; numero: string; dataPedido: string; dataPrevista: string; total: number; status: string }) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/dashboard/compras/${p.id}`} className="font-medium hover:underline">
                    {p.numero}
                  </Link>
                </td>
                <td>{formatDate(p.dataPedido)}</td>
                <td>{formatDate(p.dataPrevista)}</td>
                <td className="tabular-nums">{formatCurrency(p.total)}</td>
                <td><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/fornecedores" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{f.nome}</h2>
          <p className="text-sm text-gray-500">{formatCNPJ(f.cnpj)}</p>
        </div>
        <Link href={`/dashboard/fornecedores/${f.id}/editar`} className="btn-outline">
          <Pencil className="w-4 h-4" /> Editar
        </Link>
      </div>

      <Tabs
        items={[
          { key: "dados", label: "Dados", content: dados },
          { key: "pedidos", label: `Pedidos (${f.pedidos.length})`, content: pedidos },
        ]}
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
