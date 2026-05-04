import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText, ShieldCheck, ScrollText } from "lucide-react";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalDocumentosPage() {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) redirect("/portal/login");

  const [contratos, garantias] = await Promise.all([
    prisma.contrato.findMany({
      where: { clienteId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.garantia.findMany({
      where: { clienteId },
      orderBy: { dataInicio: "desc" },
      include: { obra: { select: { numero: true, nome: true } } },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-brand-dark">Documentos</h1>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ScrollText className="w-4 h-4 text-brand" />
          <p className="font-medium text-gray-800">Contratos</p>
        </div>
        {contratos.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum contrato.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {contratos.map((c) => (
              <li key={c.id} className="py-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.numero}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatDate(c.createdAt)} ·{" "}
                    {c.assinadoEm ? `Assinado em ${formatDate(c.assinadoEm)}` : c.status}
                  </p>
                </div>
                <Badge tone={c.status === "ASSINADO" ? "green" : "neutral"}>{c.status}</Badge>
                <a
                  href={`/api/contratos/${c.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs"
                >
                  PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-brand" />
          <p className="font-medium text-gray-800">Certificados de garantia</p>
        </div>
        {garantias.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma garantia emitida.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {garantias.map((g) => (
              <li key={g.id} className="py-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {g.tipoGarantia} — Obra {g.obra.numero}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    Vigência {formatDate(g.dataInicio)} → {formatDate(g.dataFim)}
                  </p>
                </div>
                <Badge tone={g.status === "ATIVA" ? "green" : "neutral"}>{g.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
