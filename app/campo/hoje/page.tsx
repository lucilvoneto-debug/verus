import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/campo/StatusBadge";

export const dynamic = "force-dynamic";

export default async function CampoHojePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const colaborador = await prisma.colaborador.findUnique({
    where: { userId: session.user.id },
  });

  if (!colaborador) {
    return (
      <div className="card text-sm text-gray-600">
        Seu usuário ainda não está vinculado a um colaborador.
      </div>
    );
  }

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);

  const [alocacoes, pontosHoje] = await Promise.all([
    prisma.alocacaoEquipe.findMany({
      where: {
        colaboradorId: colaborador.id,
        dataInicio: { lte: fimHoje },
        OR: [{ dataFim: null }, { dataFim: { gte: inicioHoje } }],
      },
      include: {
        obra: { include: { cliente: { select: { nome: true } } } },
      },
    }),
    prisma.pontoCampo.findMany({
      where: {
        colaboradorId: colaborador.id,
        dataHora: { gte: inicioHoje, lte: fimHoje },
      },
      include: { obra: { select: { id: true, numero: true, nome: true } } },
      orderBy: { dataHora: "desc" },
    }),
  ]);

  const seen = new Set<string>();
  const obras = alocacoes
    .filter((a) => {
      if (seen.has(a.obraId)) return false;
      seen.add(a.obraId);
      return true;
    })
    .map((a) => a.obra);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-brand-dark">Hoje</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
          })}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Obras de hoje</h2>
        {obras.length === 0 ? (
          <div className="card text-sm text-gray-600">Sem obras programadas para hoje.</div>
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
                      <p className="text-xs font-medium text-brand">{o.numero}</p>
                      <h3 className="font-display text-base font-semibold text-brand-dark truncate">
                        {o.nome}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{o.cliente.nome}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">Pontos de hoje</h2>
        {pontosHoje.length === 0 ? (
          <div className="card text-sm text-gray-600">Nenhum ponto registrado hoje.</div>
        ) : (
          <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {pontosHoje.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {p.tipo} · {p.obra.numero}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{p.obra.nome}</p>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {new Date(p.dataHora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
