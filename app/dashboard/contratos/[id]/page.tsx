"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  CheckCircle,
  XCircle,
  Flag,
  Hammer,
  Printer,
} from "lucide-react";
import {
  useContrato,
  useChangeContratoStatus,
  useGerarObra,
} from "@/hooks/useContratos";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatDocumento } from "@/lib/utils";

const statusTone: Record<string, "blue" | "yellow" | "green" | "red" | "neutral"> = {
  PENDENTE: "yellow",
  ASSINADO: "green",
  CANCELADO: "red",
  FINALIZADO: "blue",
};

export default function ContratoDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contrato, isLoading } = useContrato(params.id);
  const changeStatus = useChangeContratoStatus(params.id);
  const gerarObra = useGerarObra(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!contrato) return <div className="text-gray-500">Contrato não encontrado.</div>;

  async function setStatus(s: string) {
    try {
      await changeStatus.mutateAsync(s);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleGerarObra() {
    if (!confirm("Gerar obra a partir deste contrato?")) return;
    try {
      const o = await gerarObra.mutateAsync();
      router.push(`/dashboard/obras/${o.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap print:hidden">
        <Link href="/dashboard/contratos" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            {contrato.numero}
          </h2>
          <p className="text-sm text-gray-500">
            {contrato.cliente?.nome} ·{" "}
            <Badge tone={statusTone[contrato.status] ?? "neutral"}>{contrato.status}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => window.print()} className="btn-outline">
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <Link href={`/dashboard/contratos/${contrato.id}/editar`} className="btn-outline">
            <Pencil className="w-4 h-4" /> Editar
          </Link>
          {contrato.status === "PENDENTE" && (
            <button
              onClick={() => setStatus("ASSINADO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <CheckCircle className="w-4 h-4" /> Marcar assinado
            </button>
          )}
          {contrato.status !== "CANCELADO" && (
            <button
              onClick={() => setStatus("CANCELADO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <XCircle className="w-4 h-4" /> Cancelar
            </button>
          )}
          {contrato.status === "ASSINADO" && (
            <button
              onClick={() => setStatus("FINALIZADO")}
              disabled={changeStatus.isPending}
              className="btn-outline"
            >
              <Flag className="w-4 h-4" /> Finalizar
            </button>
          )}
          {contrato.status === "ASSINADO" && !contrato.obra && (
            <button
              onClick={handleGerarObra}
              disabled={gerarObra.isPending}
              className="btn-primary"
            >
              <Hammer className="w-4 h-4" /> Gerar obra
            </button>
          )}
          {contrato.obra && (
            <Link href={`/dashboard/obras/${contrato.obra.id}`} className="btn-primary">
              <Hammer className="w-4 h-4" /> Ver obra
            </Link>
          )}
        </div>
      </div>

      <Card>
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold text-brand-dark">
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS
          </h1>
          <p className="text-sm text-gray-500">Nº {contrato.numero}</p>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-display font-semibold mb-1">CONTRATANTE</h3>
            <p>
              {contrato.cliente.nome} ({contrato.cliente.tipo}) — Documento:{" "}
              {formatDocumento(contrato.cliente.documento, contrato.cliente.tipo)}
            </p>
            {contrato.cliente.logradouro && (
              <p className="text-gray-600">
                {[
                  contrato.cliente.logradouro,
                  contrato.cliente.numero,
                  contrato.cliente.bairro,
                  contrato.cliente.cidade,
                  contrato.cliente.uf,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>

          <div>
            <h3 className="font-display font-semibold mb-1">OBJETO</h3>
            <p className="whitespace-pre-wrap">{contrato.escopo}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Valor total" value={formatCurrency(contrato.valor)} highlight />
            <Field label="Condição de pagamento" value={contrato.condicaoPagamento} />
            <Field label="Prazo de execução" value={contrato.prazoExecucao} />
            <Field label="Garantia" value={`${contrato.garantiaMeses} meses`} />
            <Field
              label="Assinado em"
              value={contrato.assinadoEm ? formatDate(contrato.assinadoEm) : "—"}
            />
            <Field label="Status" value={contrato.status} />
          </div>

          {contrato.obrigacoesCliente && (
            <div>
              <h3 className="font-display font-semibold mb-1">OBRIGAÇÕES DO CONTRATANTE</h3>
              <p className="whitespace-pre-wrap">{contrato.obrigacoesCliente}</p>
            </div>
          )}
          {contrato.obrigacoesEmpresa && (
            <div>
              <h3 className="font-display font-semibold mb-1">OBRIGAÇÕES DA CONTRATADA</h3>
              <p className="whitespace-pre-wrap">{contrato.obrigacoesEmpresa}</p>
            </div>
          )}
          {contrato.clausulasExtras && (
            <div>
              <h3 className="font-display font-semibold mb-1">CLÁUSULAS ADICIONAIS</h3>
              <p className="whitespace-pre-wrap">{contrato.clausulasExtras}</p>
            </div>
          )}

          {contrato.orcamento && (
            <div className="text-xs text-gray-500 pt-4 border-t">
              Vinculado ao orçamento{" "}
              <Link
                href={`/dashboard/orcamento/${contrato.orcamento.id}`}
                className="text-brand hover:underline"
              >
                {contrato.orcamento.numero}
              </Link>
            </div>
          )}
        </div>
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
