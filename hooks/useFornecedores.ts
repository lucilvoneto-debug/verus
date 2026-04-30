"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FornecedorInput } from "@/lib/validations/fornecedor";

type ListParams = { q?: string; ativo?: string; page?: number; pageSize?: number };

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  });
  return sp.toString();
}

export function useFornecedores(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["fornecedores", params],
    queryFn: async () => {
      const res = await fetch(`/api/fornecedores?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar fornecedores");
      return res.json();
    },
  });
}

export function useFornecedor(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["fornecedor", id],
    queryFn: async () => {
      const res = await fetch(`/api/fornecedores/${id}`);
      if (!res.ok) throw new Error("Não encontrado");
      return res.json();
    },
  });
}

export function useCreateFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: FornecedorInput) => {
      const res = await fetch("/api/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar fornecedor");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
}

export function useUpdateFornecedor(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: FornecedorInput) => {
      const res = await fetch(`/api/fornecedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      qc.invalidateQueries({ queryKey: ["fornecedor", id] });
    },
  });
}

export function useDeleteFornecedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fornecedores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
}
