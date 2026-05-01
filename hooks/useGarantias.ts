"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GarantiaInput } from "@/lib/validations/garantia";

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
  if (p.status) sp.set("status", p.status);
  if (p.clienteId) sp.set("clienteId", p.clienteId);
  if (p.inicio) sp.set("inicio", p.inicio);
  if (p.fim) sp.set("fim", p.fim);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useGarantias(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["garantias", params],
    queryFn: async () => {
      const res = await fetch(`/api/garantias?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar garantias");
      return res.json();
    },
  });
}

export function useGarantia(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["garantia", id],
    queryFn: async () => {
      const res = await fetch(`/api/garantias/${id}`);
      if (!res.ok) throw new Error("Garantia não encontrada");
      return res.json();
    },
  });
}

export function useObrasDisponiveis() {
  return useQuery({
    queryKey: ["garantias", "obras-disponiveis"],
    queryFn: async () => {
      const res = await fetch("/api/garantias/obras-disponiveis");
      if (!res.ok) throw new Error("Erro ao carregar obras");
      return res.json();
    },
  });
}

export function useCreateGarantia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: GarantiaInput) => {
      const res = await fetch("/api/garantias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar garantia");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["garantias"] }),
  });
}

export function useUpdateGarantia(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<GarantiaInput>) => {
      const res = await fetch(`/api/garantias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar garantia");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["garantias"] });
      qc.invalidateQueries({ queryKey: ["garantia", id] });
    },
  });
}

export function useDeleteGarantia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/garantias/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir garantia");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["garantias"] }),
  });
}
