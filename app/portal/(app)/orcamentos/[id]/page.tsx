import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrcamentoActions } from "@/components/portal/OrcamentoActions";

export const dynamic = "force-dynamic";

export default async function PortalOrcamentoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) redirect("/portal/login");

  const orc = await prisma.orcamento.findFirst({
    where: { id: params.id, clienteId },
    include: {
      itens: { include: { servico: { select: { nome: true } } } },
    },
  });
  if (!orc) notFound();

  const podeAprovar = orc.status === "ENVIADO" || orc.status === "EM_NEGOCIACAO";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/portal" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold text-brand-dark">
            Orçamento {orc.numero}
          </h1>
          <Badge tone={orc.status === "APROVADO" ? "green" : "blue"}>{orc.status}</Badge>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-500">Total</p>
            <p className="font-display text-xl font-bold text-brand-dark">
              {formatCurrency(orc.total)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Validade</p>
            <p>{formatDate(orc.dataValidade)}</p>
          </div>
          {orc.condicaoPagamento && (
            <div className="col-span-2">
              <p className="text-xs uppercase text-gray-500">Condição de pagamento</p>
              <p>{orc.condicaoPagamento}</p>
            </div>
          )}
          {orc.prazoExecucao && (
            <div className="col-span-2">
              <p className="text-xs uppercase text-gray-500">Prazo</p>
              <p>{orc.prazoExecucao}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold text-brand-dark mb-3">Itens</h2>
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Un.</th>
                <th>Preço</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {orc.itens.map((it) => (
                <tr key={it.id}>
                  <td>{it.descricao}</td>
                  <td>{it.quantidade}</td>
                  <td>{it.unidade}</td>
                  <td>{formatCurrency(it.precoUnit)}</td>
                  <td>{formatCurrency(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orc.observacoes && (
          <div className="mt-4">
            <p className="text-xs uppercase text-gray-500 mb-1">Observações</p>
            <p className="text-sm whitespace-pre-wrap">{orc.observacoes}</p>
          </div>
        )}
      </Card>

      {podeAprovar && (
        <OrcamentoActions orcamentoId={orc.id} />
      )}
    </div>
  );
}
