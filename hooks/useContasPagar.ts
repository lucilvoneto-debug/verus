"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContaPagarInput, PagarInput } from "@/lib/validations/contaPagar";

type ListParams = {
  status?: string;
  fornecedorId?: string;
  categoria?: string;
  inicio?: string;
  fim?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  });
  return sp.toString();
}

export function useContasPagar(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["contas-pagar", params],
    queryFn: async () => {
      const res = await fetch(`/api/contas-pagar?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar contas a pagar");
      return res.json();
    },
  });
}

export function useContaPagar(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["conta-pagar", id],
    queryFn: async () => {
      const res = await fetch(`/api/contas-pagar/${id}`);
      if (!res.ok) throw new Error("Não encontrado");
      return res.json();
    },
  });
}

export function useCreateContaPagar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ContaPagarInput) => {
      const res = await fetch("/api/contas-pagar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas-pagar"] }),
  });
}

export function useUpdateContaPagar(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ContaPagarInput) => {
      const res = await fetch(`/api/contas-pagar/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas-pagar"] });
      qc.invalidateQueries({ queryKey: ["conta-pagar", id] });
    },
  });
}

export function useDeleteContaPagar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contas-pagar/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas-pagar"] }),
  });
}

export function usePagarConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PagarInput }) => {
      const res = await fetch(`/api/contas-pagar/${id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao pagar");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas-pagar"] });
      qc.invalidateQueries({ queryKey: ["fluxo-caixa"] });
    },
  });
}
