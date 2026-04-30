"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MaterialInput, MovimentacaoInput } from "@/lib/validations/material";

type ListParams = {
  q?: string;
  categoria?: string;
  ativo?: string;
  baixo?: string;
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

export function useMateriais(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["materiais", params],
    queryFn: async () => {
      const res = await fetch(`/api/materiais?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar materiais");
      return res.json();
    },
  });
}

export function useMaterial(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["material", id],
    queryFn: async () => {
      const res = await fetch(`/api/materiais/${id}`);
      if (!res.ok) throw new Error("Não encontrado");
      return res.json();
    },
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MaterialInput) => {
      const res = await fetch("/api/materiais", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar material");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiais"] }),
  });
}

export function useUpdateMaterial(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MaterialInput) => {
      const res = await fetch(`/api/materiais/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materiais"] });
      qc.invalidateQueries({ queryKey: ["material", id] });
    },
  });
}

export function useDeleteMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/materiais/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["materiais"] }),
  });
}

export function useMovimentarMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MovimentacaoInput }) => {
      const res = await fetch(`/api/materiais/${id}/movimentar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao movimentar");
      }
      return res.json();
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["materiais"] });
      qc.invalidateQueries({ queryKey: ["material", vars.id] });
      qc.invalidateQueries({ queryKey: ["movimentacoes"] });
    },
  });
}

export function useMovimentacoes(params: {
  materialId?: string;
  obraId?: string;
  tipo?: string;
  inicio?: string;
  fim?: string;
  page?: number;
}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  });
  return useQuery({
    queryKey: ["movimentacoes", params],
    queryFn: async () => {
      const res = await fetch(`/api/movimentacoes?${sp.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar movimentações");
      return res.json();
    },
  });
}
