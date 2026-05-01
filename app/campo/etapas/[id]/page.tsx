import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CampoEtapaForm } from "@/components/campo/CampoEtapaForm";

export const dynamic = "force-dynamic";

function parseList(s: string | null): unknown[] {
  if (!s) return [];
  try {
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default async function CampoEtapaPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const etapa = await prisma.etapa.findUnique({
    where: { id: params.id },
    include: { obra: { select: { id: true, numero: true, nome: true } } },
  });

  if (!etapa) notFound();

  const checklist = parseList(etapa.checklist) as { nome: string; done: boolean }[];
  const fotos = parseList(etapa.fotos) as string[];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href={`/campo/obras/${etapa.obra.id}`}
          className="p-2 rounded-lg hover:bg-gray-100 min-h-10 min-w-10 flex items-center justify-center"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-brand font-medium">
            Etapa {etapa.ordem} · {etapa.obra.numero}
          </p>
          <h1 className="font-display text-lg font-bold text-brand-dark truncate">
            {etapa.nome}
          </h1>
        </div>
      </div>

      <CampoEtapaForm
        etapa={{
          id: etapa.id,
          obraId: etapa.obraId,
          ordem: etapa.ordem,
          nome: etapa.nome,
          descricao: etapa.descricao || "",
          responsavelId: etapa.responsavelId || "",
          dataPrevista: etapa.dataPrevista.toISOString(),
          status: etapa.status as "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "ATRASADA",
          observacoes: etapa.observacoes || "",
          checklist,
          fotos,
        }}
      />
    </div>
  );
}
