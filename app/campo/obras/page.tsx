import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/campo/StatusBadge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CampoObrasPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const colaborador = await prisma.colaborador.findUnique({
    where: { userId: session.user.id },
  });

  if (!colaborador) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-xl font-bold text-brand-dark">Minhas obras</h1>
        <div className="card text-sm text-gray-600">
          Seu usuário ainda não está vinculado a um colaborador. Procure o administrador para
          liberar seu acesso de campo.
        </div>
      </div>
    );
  }

  const hoje = new Date();
  const alocacoes = await prisma.alocacaoEquipe.findMany({
    where: {
      colaboradorId: colaborador.id,
      OR: [{ dataFim: null }, { dataFim: { gte: hoje } }],
    },
    include: {
      obra: {
        include: {
          cliente: { select: { id: true, nome: true } },
          etapas: { select: { status: true } },
        },
      },
    },
    orderBy: { dataInicio: "desc" },
  });

  const seen = new Set<string>();
  const obras = alocacoes
    .filter((a) => {
      if (seen.has(a.obraId)) return false;
      seen.add(a.obraId);
      return true;
    })
    .map((a) => {
      const total = a.obra.etapas.length;
      const concluidas = a.obra.etapas.filter((e) => e.status === "CONCLUIDA").length;
      const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0;
      return { ...a.obra, papel: a.papel, progresso };
    });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-xl font-bold text-brand-dark">Minhas obras</h1>
        <p className="text-sm text-gray-500">
          {obras.length} {obras.length === 1 ? "obra alocada" : "obras alocadas"}
        </p>
      </div>

      {obras.length === 0 ? (
        <div className="card text-sm text-gray-600">
          Você não tem obras alocadas no momento.
        </div>
      ) : (
        <ul className="space-y-3">
          {obras.map((o) => (
            <li key={o.id}>
              <Link
                href={`/campo/obras/${o.id}`}
                className="block bg-white border border-gray-200 rounded-xl shadow-sm p-4 active:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-brand">{o.numero} · {o.papel}</p>
                    <h2 className="font-display text-lg font-semibold text-brand-dark truncate">
                      {o.nome}
                    </h2>
                    <p className="text-sm text-gray-600 truncate">{o.cliente.nome}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{o.endereco}</span>
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <StatusBadge status={o.status} />
                  <span className="text-gray-500">
                    Prev. {formatDate(o.previsaoTermino)}
                  </span>
                </div>

                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand"
                    style={{ width: `${o.progresso}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">{o.progresso}% concluído</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
