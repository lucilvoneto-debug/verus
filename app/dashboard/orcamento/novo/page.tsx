"use client";

import { Suspense, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrcamentoEditor } from "@/components/orcamento/OrcamentoEditor";
import { useCreateOrcamento } from "@/hooks/useOrcamentos";
import type { OrcamentoItemInput } from "@/lib/validations/orcamento";

const MOTOR_ITEM_KEY = "motor-orcamento-item";

/**
 * Lê o item pré-calculado pelo Motor de orçamento (se houver) de forma
 * SÍNCRONA, no inicializador do useState — não em um useEffect. OrcamentoEditor
 * faz `useState(defaultValues?.itens ?? [])`, ou seja, só lê a prop uma vez no
 * mount: se o valor chegasse depois (via effect assíncrono), o item nunca
 * apareceria no editor.
 */
function lerItemDoMotor(): OrcamentoItemInput[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(MOTOR_ITEM_KEY);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (!item || typeof item !== "object" || !item.servicoId) return null;
    return [item as OrcamentoItemInput];
  } catch {
    return null;
  }
}

function NovoOrcamentoPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const create = useCreateOrcamento();

  const visitaId = sp.get("visitaId") ?? undefined;
  const clienteId = sp.get("clienteId") ?? undefined;

  const [itensPrefill] = useState<OrcamentoItemInput[] | null>(() => lerItemDoMotor());

  // Some com a chave depois que o valor já foi consumido no estado inicial
  // do editor, pra não vazar num "novo orçamento" futuro sem relação.
  useEffect(() => {
    if (itensPrefill) sessionStorage.removeItem(MOTOR_ITEM_KEY);
  }, [itensPrefill]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orcamento" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Novo orçamento</h2>
          <p className="text-sm text-gray-500">
            Numeração automática · cálculos no servidor.
          </p>
        </div>
      </div>

      <OrcamentoEditor
        defaultValues={{
          clienteId,
          visitaId,
          itens: itensPrefill ?? [],
          desconto: 0,
        }}
        submitting={create.isPending}
        onSubmit={async (data) => {
          try {
            const o = await create.mutateAsync(data);
            router.push(`/dashboard/orcamento/${o.id}`);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro ao criar");
          }
        }}
      />
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="p-6 text-sm text-gray-500">Carregando...</div>}><NovoOrcamentoPageInner /></Suspense>; }
