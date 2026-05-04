import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Building2, ShieldCheck, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalHomePage() {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) redirect("/portal/login");

  const [obraAtiva, garantia, orcamentosPendentes, contasAbertas, etapasRecentes] =
    await Promise.all([
      prisma.obra.findFirst({
        where: { clienteId, status: { in: ["EM_ANDAMENTO", "ATRASADA", "AGUARDANDO"] } },
        orderBy: { dataInicio: "desc" },
        include: {
          etapas: { orderBy: { ordem: "asc" } },
        },
      }),
      prisma.garantia.findFirst({
        where: { clienteId, status: "ATIVA" },
        orderBy: { dataFim: "asc" },
      }),
      prisma.orcamento.findMany({
        where: { clienteId, status: { in: ["ENVIADO", "EM_NEGOCIACAO"] } },
        orderBy: { criadoEm: "desc" },
        take: 5,
      }),
      prisma.contaReceber.findMany({
        where: { clienteId, status: { in: ["ABERTA", "ATRASADA", "PARCIAL"] } },
        orderBy: { vencimento: "asc" },
        take: 5,
      }),
      prisma.etapa.findMany({
        where: { obra: { clienteId }, status: "CONCLUIDA" },
        orderBy: { dataRealizada: "desc" },
        take: 5,
        include: { obra: { select: { nome: true } } },
      }),
    ]);

  const progressoObra = obraAtiva
    ? Math.round(
        (obraAtiva.etapas.filter((e) => e.status === "CONCLUIDA").length /
          Math.max(obraAtiva.etapas.length, 1)) *
          100
      )
    : 0;

  const proximasEtapas = obraAtiva
    ? obraAtiva.etapas
        .filter((e) => e.status === "PENDENTE" || e.status === "EM_ANDAMENTO")
        .slice(0, 3)
    : [];

  const garantiaInfo = garantia ? garantiaTone(garantia.dataFim) : null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-dark">
          Olá, {session.user.clienteNome ?? session.user.name}
        </h1>
        <p className="text-sm text-gray-500">Acompanhe sua obra e seus documentos.</p>
      </div>

      {obraAtiva ? (
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-light text-brand">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-500">Sua obra atual</p>
              <p className="font-semibold text-gray-900 truncate">{obraAtiva.nome}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge tone={obraAtiva.status === "ATRASADA" ? "red" : "blue"}>
                  {obraAtiva.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  Início {formatDate(obraAtiva.dataInicio)} · Previsão{" "}
                  {formatDate(obraAtiva.previsaoTermino)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Progresso</span>
              <span className="font-medium text-gray-700">{progressoObra}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-brand"
                style={{ width: `${progressoObra}%` }}
              />
            </div>
          </div>
          {proximasEtapas.length > 0 && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                Próximas etapas
              </p>
              <ul className="space-y-2">
                {proximasEtapas.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between text-sm border border-gray-100 rounded-md px-3 py-2"
                  >
                    <span className="truncate">{e.nome}</span>
                    <span className="text-xs text-gray-500">{formatDate(e.dataPrevista)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4">
            <Link
              href={`/portal/obras/${obraAtiva.id}`}
              className="btn-outline w-full justify-center"
            >
              Ver detalhes da obra
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-gray-500">Nenhuma obra ativa no momento.</p>
        </Card>
      )}

      {garantia && garantiaInfo && (
        <Card>
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${garantiaInfo.bg}`}
            >
              <ShieldCheck className={`w-5 h-5 ${garantiaInfo.text}`} />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">Garantia</p>
              <p className="font-semibold text-gray-900">{garantia.tipoGarantia}</p>
              <p className={`text-sm ${garantiaInfo.text}`}>
                {garantiaInfo.label} — vence em {formatDate(garantia.dataFim)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {(orcamentosPendentes.length > 0 || contasAbertas.length > 0) && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-warning" />
            <p className="font-medium text-gray-800">Pendências</p>
          </div>
          {orcamentosPendentes.length > 0 && (
            <div className="mb-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Orçamentos para aprovar
              </p>
              <ul className="divide-y divide-gray-100">
                {orcamentosPendentes.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/portal/orcamentos/${o.id}`}
                      className="flex items-center justify-between py-2 text-sm hover:bg-gray-50 rounded-md px-2"
                    >
                      <span className="truncate">{o.numero}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-gray-700">{formatCurrency(o.total)}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {contasAbertas.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Contas em aberto
              </p>
              <ul className="divide-y divide-gray-100">
                {contasAbertas.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="truncate">{c.descricao}</span>
                    <span className="flex items-center gap-2">
                      <Badge tone={c.status === "ATRASADA" ? "red" : "yellow"}>
                        {c.status}
                      </Badge>
                      <span className="text-gray-700">{formatCurrency(c.valor)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {etapasRecentes.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-brand" />
            <p className="font-medium text-gray-800">Últimas atualizações</p>
          </div>
          <ul className="space-y-3">
            {etapasRecentes.map((e) => (
              <li key={e.id} className="text-sm">
                <p className="font-medium text-gray-800">{e.nome}</p>
                <p className="text-xs text-gray-500">
                  {e.obra.nome}
                  {e.dataRealizada ? ` · ${formatDate(e.dataRealizada)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function garantiaTone(dataFim: Date): { bg: string; text: string; label: string } {
  const diasRestantes = Math.floor(
    (new Date(dataFim).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diasRestantes < 0) {
    return { bg: "bg-red-50", text: "text-red-700", label: "Vencida" };
  }
  if (diasRestantes < 90) {
    return { bg: "bg-amber-50", text: "text-amber-700", label: `${diasRestantes} dias restantes` };
  }
  return { bg: "bg-emerald-50", text: "text-emerald-700", label: "Ativa" };
}
