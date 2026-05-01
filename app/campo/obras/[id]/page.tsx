import Link from "next/link";
import { ArrowLeft, MapPin, Phone } from "lucide-react";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/campo/StatusBadge";
import { CampoObraActions } from "@/components/campo/CampoObraActions";
import { CampoEtapasList } from "@/components/campo/CampoEtapasList";

export const dynamic = "force-dynamic";

export default async function CampoObraDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const colaborador = await prisma.colaborador.findUnique({
    where: { userId: session.user.id },
  });

  const obra = await prisma.obra.findUnique({
    where: { id: params.id },
    include: {
      cliente: {
        select: { id: true, nome: true, telefone: true, whatsapp: true },
      },
      etapas: { orderBy: { ordem: "asc" } },
    },
  });

  if (!obra) notFound();

  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);

  let ultimoPontoHoje: { tipo: string; dataHora: Date } | null = null;
  if (colaborador) {
    const p = await prisma.pontoCampo.findFirst({
      where: {
        colaboradorId: colaborador.id,
        obraId: obra.id,
        dataHora: { gte: inicioHoje, lte: fimHoje },
      },
      orderBy: { dataHora: "desc" },
      select: { tipo: true, dataHora: true },
    });
    ultimoPontoHoje = p;
  }

  const materiais = await prisma.material.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, unidade: true, estoqueAtual: true },
  });

  const podeAssinar = obra.status === "FINALIZADA" || obra.status === "EM_ANDAMENTO";
  const enderecoUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(obra.endereco)}`;
  const telLink = obra.cliente.whatsapp || obra.cliente.telefone;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/campo/obras"
          className="p-2 rounded-lg hover:bg-gray-100 min-h-10 min-w-10 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-brand font-medium">{obra.numero}</p>
          <h1 className="font-display text-lg font-bold text-brand-dark truncate">
            {obra.nome}
          </h1>
        </div>
        <StatusBadge status={obra.status} />
      </div>

      <div className="card space-y-2">
        <div>
          <p className="text-xs text-gray-500">Cliente</p>
          <p className="text-base font-medium text-gray-800">{obra.cliente.nome}</p>
        </div>
        <a
          href={enderecoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-brand active:opacity-70"
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="underline-offset-2 hover:underline break-words">
            {obra.endereco}
          </span>
        </a>
        {telLink && (
          <a
            href={`tel:${telLink.replace(/\D/g, "")}`}
            className="flex items-center gap-2 text-sm text-brand"
          >
            <Phone className="w-4 h-4" />
            {telLink}
          </a>
        )}
      </div>

      <CampoObraActions
        obraId={obra.id}
        ultimoPontoTipo={ultimoPontoHoje?.tipo ?? null}
        ultimoPontoData={ultimoPontoHoje ? ultimoPontoHoje.dataHora.toISOString() : null}
        materiais={materiais}
        podeAssinar={podeAssinar}
        colaboradorVinculado={!!colaborador}
      />

      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          Etapas ({obra.etapas.length})
        </h2>
        <CampoEtapasList etapas={obra.etapas} />
      </section>
    </div>
  );
}
