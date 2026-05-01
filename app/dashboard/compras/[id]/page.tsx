"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Send, PackageCheck, XCircle, Pencil } from "lucide-react";
import {
  useCompra,
  useCancelarCompra,
  useEnviarCompra,
  useReceberCompra,
} from "@/hooks/useCompras";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusTone = (s: string) =>
  s === "RECEBIDO" ? "green" : s === "ENVIADO" ? "blue" : s === "CANCELADO" ? "red" : "neutral";

type Item = {
  id: string;
  quantidade: number;
  custoUnit: number;
  subtotal: number;
  material: { id: string; nome: string; unidade: string };
};

export default function PedidoDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: pedido, isLoading } = useCompra(params.id);
  const enviar = useEnviarCompra();
  const receber = useReceberCompra();
  const cancelar = useCancelarCompra();

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!pedido) return <div className="text-gray-500">Pedido não encontrado.</div>;

  async function action(fn: { mutateAsync: (id: string) => Promise<unknown> }, label: string) {
    if (!confirm(`Confirmar ${label}?`)) return;
    try {
      await fn.mutateAsync(pedido.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/compras" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{pedido.numero}</h2>
          <p className="text-sm text-gray-500">
            {pedido.fornecedor.nome} · <Badge tone={statusTone(pedido.status)}>{pedido.status}</Badge>
          </p>
        </div>
        {pedido.status === "RASCUNHO" && (
          <>
            <Link href={`/dashboard/compras/${pedido.id}/editar`} className="btn-outline">
              <Pencil className="w-4 h-4" /> Editar
            </Link>
            <button
              onClick={() => action(enviar, "envio do pedido")}
              className="btn-outline"
              disabled={enviar.isPending}
            >
              <Send className="w-4 h-4" /> Enviar
            </button>
          </>
        )}
        {pedido.status === "ENVIADO" && (
          <button
            onClick={() => action(receber, "recebimento do pedido (atualiza estoque)")}
            className="btn-primary"
            disabled={receber.isPending}
          >
            <PackageCheck className="w-4 h-4" /> Receber
          </button>
        )}
        {pedido.status !== "RECEBIDO" && pedido.status !== "CANCELADO" && (
          <button
            onClick={() => action(cancelar, "cancelamento do pedido")}
            className="btn-outline"
            disabled={cancelar.isPending}
          >
            <XCircle className="w-4 h-4" /> Cancelar
          </button>
        )}
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field label="Fornecedor" value={pedido.fornecedor.nome} />
          <Field label="Data do pedido" value={formatDate(pedido.dataPedido)} />
          <Field label="Previsão" value={formatDate(pedido.dataPrevista)} />
        </div>
        {pedido.observacoes && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Observações</div>
            <p className="text-sm whitespace-pre-wrap">{pedido.observacoes}</p>
          </div>
        )}
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantidade</th>
                <th>Custo unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map((i: Item) => (
                <tr key={i.id}>
                  <td className="font-medium">{i.material.nome}</td>
                  <td className="tabular-nums">{i.quantidade} {i.material.unidade}</td>
                  <td className="tabular-nums">{formatCurrency(i.custoUnit)}</td>
                  <td className="tabular-nums">{formatCurrency(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right font-medium">Total</td>
                <td className="font-display text-lg font-bold tabular-nums">{formatCurrency(pedido.total)}</td>
              </tr>
            </tfoot>
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
