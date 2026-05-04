import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ChevronRight } from "lucide-react";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalObrasPage() {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) redirect("/portal/login");

  const obras = await prisma.obra.findMany({
    where: { clienteId },
    orderBy: { dataInicio: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-brand-dark">Minhas obras</h1>

      {obras.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">Nenhuma obra cadastrada.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {obras.map((o) => (
            <Link key={o.id} href={`/portal/obras/${o.id}`}>
              <Card className="hover:border-brand transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{o.nome}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {o.numero} · Início {formatDate(o.dataInicio)}
                    </p>
                    <div className="mt-1">
                      <Badge tone={o.status === "ATRASADA" ? "red" : "blue"}>{o.status}</Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
