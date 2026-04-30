"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContaReceberInput, ReceberInput } from "@/lib/validations/contaReceber";

type ListParams = {
  status?: string;
  clienteId?: string;
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

export function useContasReceber(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["contas-receber", params],
    queryFn: async () => {
      const res = await fetch(`/api/contas-receber?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar contas a receber");
      return res.json();
    },
  });
}

export function useContaReceber(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["conta-receber", id],
    queryFn: async () => {
      const res = await fetch(`/api/contas-receber/${id}`);
      if (!res.ok) throw new Error("Não encontrado");
      return res.json();
    },
  });
}

export function useCreateContaReceber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ContaReceberInput) => {
      const res = await fetch("/api/contas-receber", {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas-receber"] }),
  });
}

export function useUpdateContaReceber(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ContaReceberInput) => {
      const res = await fetch(`/api/contas-receber/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas-receber"] });
      qc.invalidateQueries({ queryKey: ["conta-receber", id] });
    },
  });
}

export function useDeleteContaReceber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contas-receber/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas-receber"] }),
  });
}

export function useReceberConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReceberInput }) => {
      const res = await fetch(`/api/contas-receber/${id}/receber`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao receber");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contas-receber"] });
      qc.invalidateQueries({ queryKey: ["fluxo-caixa"] });
    },
  });
}
