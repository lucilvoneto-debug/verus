"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { EtapaInput } from "@/lib/validations/etapa";
import type { Paginated } from "@/types";

export type EtapaListItem = {
  id: string;
  ordem: number;
  nome: string;
  status: string;
  dataPrevista: string;
  dataRealizada: string | null;
  obra: { id: string; numero: string; nome: string };
  responsavel: { id: string; name: string } | null;
  fotosCount: number;
};

type ListParams = {
  obraId?: string;
  status?: string;
  responsavelId?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.obraId) sp.set("obraId", p.obraId);
  if (p.status) sp.set("status", p.status);
  if (p.responsavelId) sp.set("responsavelId", p.responsavelId);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useEtapas(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery<Paginated<EtapaListItem>>({
    queryKey: ["etapas", params],
    queryFn: async () => {
      const res = await fetch(`/api/etapas?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar etapas");
      return res.json();
    },
  });
}

export function useEtapa(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["etapa", id],
    queryFn: async () => {
      const res = await fetch(`/api/etapas/${id}`);
      if (!res.ok) throw new Error("Etapa não encontrada");
      return res.json();
    },
  });
}

export function useCreateEtapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: EtapaInput) => {
      const res = await fetch("/api/etapas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar etapa");
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["etapas"] });
      qc.invalidateQueries({ queryKey: ["obra", vars.obraId] });
    },
  });
}

export function useUpdateEtapa(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: EtapaInput) => {
      const res = await fetch(`/api/etapas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar etapa");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["etapas"] });
      qc.invalidateQueries({ queryKey: ["etapa", id] });
      qc.invalidateQueries({ queryKey: ["obra", vars.obraId] });
    },
  });
}

export function useDeleteEtapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/etapas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir etapa");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["etapas"] });
      qc.invalidateQueries({ queryKey: ["obra"] });
    },
  });
}

export function useToggleChecklist(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ index, done }: { index: number; done: boolean }) => {
      const res = await fetch(`/api/etapas/${id}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index, done }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar checklist");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["etapa", id] });
      qc.invalidateQueries({ queryKey: ["etapas"] });
    },
  });
}

export function useUpdateEtapaStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/etapas/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erro ao mudar status");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["etapa", id] });
      qc.invalidateQueries({ queryKey: ["etapas"] });
      qc.invalidateQueries({ queryKey: ["obra"] });
    },
  });
}
