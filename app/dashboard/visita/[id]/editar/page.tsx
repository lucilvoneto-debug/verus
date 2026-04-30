"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { VisitaForm } from "@/components/visita/VisitaForm";
import { useVisita, useUpdateVisita } from "@/hooks/useVisitas";
import type { VisitaInput } from "@/lib/validations/visita";

function toLocalInput(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function EditarVisitaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useVisita(params.id);
  const update = useUpdateVisita(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!data) return <div className="text-gray-500">Não encontrado.</div>;

  const defaults: Partial<VisitaInput> = {
    clienteId: data.clienteId,
    tecnicoId: data.tecnicoId,
    endereco: data.endereco,
    dataAgendada: toLocalInput(data.dataAgendada),
    observacoes: data.observacoes ?? "",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/visita/${params.id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Editar visita</h2>
          <p className="text-sm text-gray-500">{data.cliente?.nome}</p>
        </div>
      </div>

      <VisitaForm
        defaultValues={defaults}
        submitting={update.isPending}
        submitLabel="Salvar alterações"
        onSubmit={async (formData) => {
          try {
            await update.mutateAsync(formData);
            router.push(`/dashboard/visita/${params.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
