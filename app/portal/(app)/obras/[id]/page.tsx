import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";
import { clienteAuthOptions } from "@/lib/cliente-auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function parseFotos(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter((x): x is string => typeof x === "string");
    return [];
  } catch {
    return [];
  }
}

export default async function PortalObraDetalhePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(clienteAuthOptions);
  const clienteId = session?.user?.clienteId;
  if (!clienteId) redirect("/portal/login");

  const obra = await prisma.obra.findFirst({
    where: { id: params.id, clienteId },
    include: {
      etapas: { orderBy: { ordem: "asc" } },
      diarios: {
        where: {
          data: { gte: new Date(Date.now() - 30 * 86400000) },
        },
        orderBy: { data: "desc" },
        include: { autor: { select: { name: true } } },
      },
      medicoes: { orderBy: { numero: "asc" } },
    },
  });

  if (!obra) notFound();

  const anexos = await prisma.anexo.findMany({
    where: { entidade: "OBRA", entidadeId: obra.id },
    orderBy: { createdAt: "desc" },
  });

  const fotosGaleria: { url: string; origem: string }[] = [];
  obra.etapas.forEach((e) => {
    parseFotos(e.fotos).forEach((u) => fotosGaleria.push({ url: u, origem: e.nome }));
  });
  obra.diarios.forEach((d) => {
    parseFotos(d.fotos).forEach((u) =>
      fotosGaleria.push({ url: u, origem: `Diário ${formatDate(d.data)}` })
    );
  });

  const etapasTab = (
    <Card>
      {obra.etapas.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma etapa.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {obra.etapas.map((e) => {
            const fotos = parseFotos(e.fotos);
            return (
              <li key={e.id} className="py-3">
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      e.status === "CONCLUIDA"
                        ? "green"
                        : e.status === "EM_ANDAMENTO"
                        ? "blue"
                        : e.status === "ATRASADA"
                        ? "red"
                        : "neutral"
                    }
                  >
                    {e.status}
                  </Badge>
                  <span className="font-medium text-gray-900">{e.nome}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {formatDate(e.dataPrevista)}
                  </span>
                </div>
                {e.descricao && (
                  <p className="text-sm text-gray-600 mt-1">{e.descricao}</p>
                )}
                {fotos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                    {fotos.map((u, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={u}
                        alt=""
                        className="w-full h-20 object-cover rounded-md border border-gray-100"
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );

  const diarioTab = (
    <Card>
      {obra.diarios.length === 0 ? (
        <p className="text-sm text-gray-500">Sem entradas nos últimos 30 dias.</p>
      ) : (
        <ul className="space-y-3">
          {obra.diarios.map((d) => (
            <li key={d.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatDateTime(d.data)}</span>
                <span>·</span>
                <span>{d.autor.name}</span>
                {d.condicaoTempo && <Badge tone="neutral">{d.condicaoTempo}</Badge>}
              </div>
              <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{d.descricao}</p>
              {d.problemas && (
                <p className="text-sm text-red-700 mt-1">Problemas: {d.problemas}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const medicoesTab = (
    <Card>
      {obra.medicoes.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma medição.</p>
      ) : (
        <table className="table-verus">
          <thead>
            <tr>
              <th>Nº</th>
              <th>Data</th>
              <th>%</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {obra.medicoes.map((m) => (
              <tr key={m.id}>
                <td className="font-medium">{m.numero}</td>
                <td>{formatDate(m.dataReferencia)}</td>
                <td>{m.percentualExecutado}%</td>
                <td>{formatCurrency(m.valor)}</td>
                <td>
                  <Badge tone={m.status === "FATURADA" ? "green" : "neutral"}>{m.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );

  const documentosTab = (
    <Card>
      {anexos.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum documento anexado.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {anexos.map((a) => (
            <li key={a.id} className="py-2 flex items-center justify-between">
              <span className="text-sm truncate">{a.nome}</span>
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline text-xs"
              >
                Baixar
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );

  const galeriaTab = (
    <Card>
      {fotosGaleria.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhuma foto disponível.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {fotosGaleria.map((f, i) => (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt={f.origem}
                className="w-full h-32 object-cover rounded-md border border-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1 truncate">{f.origem}</p>
            </a>
          ))}
        </div>
      )}
    </Card>
  );

  const progresso = Math.round(
    (obra.etapas.filter((e) => e.status === "CONCLUIDA").length /
      Math.max(obra.etapas.length, 1)) *
      100
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/portal/obras" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold text-brand-dark truncate">
            {obra.nome}
          </h1>
          <p className="text-xs text-gray-500 truncate">{obra.numero}</p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs uppercase text-gray-500">Status</p>
            <Badge tone={obra.status === "ATRASADA" ? "red" : "blue"}>{obra.status}</Badge>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Progresso</p>
            <p className="font-medium">{progresso}%</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Início</p>
            <p>{formatDate(obra.dataInicio)}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Previsão</p>
            <p>{formatDate(obra.previsaoTermino)}</p>
          </div>
        </div>
      </Card>

      <Tabs
        items={[
          { key: "etapas", label: `Etapas (${obra.etapas.length})`, content: etapasTab },
          { key: "diario", label: `Diário (${obra.diarios.length})`, content: diarioTab },
          {
            key: "medicoes",
            label: `Medições (${obra.medicoes.length})`,
            content: medicoesTab,
          },
          { key: "docs", label: `Docs (${anexos.length})`, content: documentosTab },
          { key: "fotos", label: `Fotos (${fotosGaleria.length})`, content: galeriaTab },
        ]}
      />
    </div>
  );
}
