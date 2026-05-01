"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  XCircle,
  Clock,
  ScrollText,
} from "lucide-react";
import {
  useOrcamento,
  useChangeOrcamentoStatus,
  useGerarContrato,
} from "@/hooks/useOrcamentos";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  RASCUNHO: "neutral",
  ENVIADO: "blue",
  APROVADO: "green",
  RECUSADO: "red",
  VENCIDO: "yellow",
};

export default function OrcamentoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: orc, isLoading } = useOrcamento(params.id);
  const changeStatus = useChangeOrcamentoStatus(params.id);
  const gerarContrato = useGerarContrato(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!orc) return <div className="text-gray-500">Orçamento não encontrado.</div>;

  async function setStatus(s: string) {
    try {
      await changeStatus.mutateAsync(s);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleGerarContrato() {
    if (!confirm("Gerar contrato a partir deste orçamento?")) return;
    try {
      const c = await gerarContrato.mutateAsync();
      router.push(`/dashboard/contratos/${c.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/dashboard/orcamento" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{orc.numero}</h2>
          <p className="text-sm text-gray-500">
            {orc.cliente?.nome} ·{" "}
            <Badge tone={statusTone[orc.status] ?? "neutral"}>{orc.status}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/dashboard/orcamento/${orc.id}/editar`} className="btn-outline">
            <Pencil className="w-4 h-4" /> Editar
          </Link>
          {orc.status !== "APROVADO" && (
            <button
              onClick={() => setStatus("APROVADO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <CheckCircle className="w-4 h-4" /> Aprovar
            </button>
          )}
          {orc.status !== "RECUSADO" && (
            <button
              onClick={() => setStatus("RECUSADO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <XCircle className="w-4 h-4" /> Recusar
            </button>
          )}
          {orc.status !== "VENCIDO" && (
            <button
              onClick={() => setStatus("VENCIDO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <Clock className="w-4 h-4" /> Marcar vencido
            </button>
          )}
          {orc.status === "APROVADO" && !orc.contrato && (
            <button
              onClick={handleGerarContrato}
              disabled={gerarContrato.isPending}
              className="btn-primary"
            >
              <ScrollText className="w-4 h-4" /> Gerar contrato
            </button>
          )}
          {orc.contrato && (
            <Link href={`/dashboard/contratos/${orc.contrato.id}`} className="btn-primary">
              <ScrollText className="w-4 h-4" /> Ver contrato
            </Link>
          )}
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Field label="Cliente" value={orc.cliente?.nome ?? "—"} />
          <Field label="Vendedor" value={orc.vendedor?.name ?? "—"} />
          <Field label="Validade" value={formatDate(orc.dataValidade)} />
          <Field label="Criado em" value={formatDate(orc.criadoEm)} />
          <Field
            label="Aprovado em"
            value={orc.aprovadoEm ? formatDate(orc.aprovadoEm) : "—"}
          />
          <Field
            label="Visita vinculada"
            value={
              orc.visita
                ? `${formatDate(orc.visita.dataAgendada)} — ${orc.visita.endereco}`
                : "—"
            }
          />
          <Field label="Condição de pagamento" value={orc.condicaoPagamento ?? "—"} />
          <Field label="Prazo de execução" value={orc.prazoExecucao ?? "—"} />
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Unid.</th>
                <th>Preço unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orc.itens.map(
                (it: {
                  id: string;
                  servico: { nome: string };
                  descricao: string;
                  quantidade: number;
                  unidade: string;
                  precoUnit: number;
                  subtotal: number;
                }) => (
                  <tr key={it.id}>
                    <td className="font-medium">{it.servico.nome}</td>
                    <td>{it.descricao}</td>
                    <td className="tabular-nums">{it.quantidade}</td>
                    <td>{it.unidade}</td>
                    <td>{formatCurrency(it.precoUnit)}</td>
                    <td>{formatCurrency(it.subtotal)}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <Field label="Subtotal" value={formatCurrency(orc.subtotal)} />
          <Field label="Desconto" value={formatCurrency(orc.desconto)} />
          <Field label="Total" value={formatCurrency(orc.total)} highlight />
          <Field
            label="Margem prevista"
            value={`${orc.margemPrevista.toFixed(1)}%`}
            highlight
          />
        </div>
        {orc.observacoes && (
          <div className="mt-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Observações
            </div>
            <p className="text-sm whitespace-pre-wrap">{orc.observacoes}</p>
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div
        className={
          highlight
            ? "font-display text-lg font-semibold text-brand-dark"
            : "text-gray-900"
        }
      >
        {value}
      </div>
    </div>
  );
}
