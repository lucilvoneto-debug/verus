"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FabricanteInput } from "@/lib/validations/fabricante";

type ListParams = {
  q?: string;
  ativo?: string;
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

export function useFabricantes(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["fabricantes", params],
    queryFn: async () => {
      const res = await fetch(`/api/fabricantes?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar fabricantes");
      return res.json();
    },
  });
}

export function useFabricante(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["fabricante", id],
    queryFn: async () => {
      const res = await fetch(`/api/fabricantes/${id}`);
      if (!res.ok) throw new Error("Não encontrado");
      return res.json();
    },
  });
}

export function useCreateFabricante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: FabricanteInput) => {
      const res = await fetch("/api/fabricantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar fabricante");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fabricantes"] }),
  });
}

export function useUpdateFabricante(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: FabricanteInput) => {
      const res = await fetch(`/api/fabricantes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fabricantes"] });
      qc.invalidateQueries({ queryKey: ["fabricante", id] });
    },
  });
}

export function useDeleteFabricante() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/fabricantes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fabricantes"] }),
  });
}
