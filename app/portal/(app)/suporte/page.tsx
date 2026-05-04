import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { NovoChamadoForm } from "@/components/portal/NovoChamadoForm";

export const dynamic = "force-dynamic";

export default async function PortalSuportePage() {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) redirect("/portal/login");

  const [garantias, chamados] = await Promise.all([
    prisma.garantia.findMany({
      where: { clienteId, status: "ATIVA" },
      include: { obra: { select: { nome: true, numero: true } } },
      orderBy: { dataInicio: "desc" },
    }),
    prisma.chamadoAssistencia.findMany({
      where: { clienteId },
      orderBy: { dataAbertura: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-brand-dark">Suporte</h1>

      <Card>
        <h2 className="font-medium text-gray-800 mb-3">Abrir chamado de assistência</h2>
        {garantias.length === 0 ? (
          <p className="text-sm text-gray-500">
            Você não possui garantias ativas no momento. Entre em contato com a equipe Verus.
          </p>
        ) : (
          <NovoChamadoForm
            garantias={garantias.map((g) => ({
              id: g.id,
              label: `${g.obra.numero} — ${g.obra.nome} (${g.tipoGarantia})`,
            }))}
          />
        )}
      </Card>

      <Card>
        <h2 className="font-medium text-gray-800 mb-3">Meus chamados</h2>
        {chamados.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum chamado aberto.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {chamados.map((c) => (
              <li key={c.id} className="py-3">
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      c.status === "CONCLUIDO"
                        ? "green"
                        : c.status === "EM_ANDAMENTO"
                        ? "blue"
                        : "yellow"
                    }
                  >
                    {c.status}
                  </Badge>
                  <span className="text-xs text-gray-500 ml-auto">
                    {formatDate(c.dataAbertura)}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{c.descricao}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
