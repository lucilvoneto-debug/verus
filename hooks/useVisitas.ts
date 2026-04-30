"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { VisitaInput, VisitaUpdateInput } from "@/lib/validations/visita";

type ListParams = {
  status?: string;
  tecnicoId?: string;
  dataIni?: string;
  dataFim?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.status) sp.set("status", p.status);
  if (p.tecnicoId) sp.set("tecnicoId", p.tecnicoId);
  if (p.dataIni) sp.set("dataIni", p.dataIni);
  if (p.dataFim) sp.set("dataFim", p.dataFim);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useVisitas(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["visitas", params],
    queryFn: async () => {
      const res = await fetch(`/api/visita?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar visitas");
      return res.json();
    },
  });
}

export function useVisita(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["visita", id],
    queryFn: async () => {
      const res = await fetch(`/api/visita/${id}`);
      if (!res.ok) throw new Error("Visita não encontrada");
      return res.json();
    },
  });
}

export function useCreateVisita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: VisitaInput) => {
      const res = await fetch("/api/visita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar visita");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitas"] }),
  });
}

export function useUpdateVisita(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: VisitaUpdateInput) => {
      const res = await fetch(`/api/visita/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar visita");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visitas"] });
      qc.invalidateQueries({ queryKey: ["visita", id] });
    },
  });
}

export function useDeleteVisita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/visita/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir visita");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visitas"] }),
  });
}

export function useVisitaCheckIn(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/visita/${id}/check-in`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao realizar check-in");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visita", id] }),
  });
}

export function useVisitaCheckOut(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/visita/${id}/check-out`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao realizar check-out");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["visita", id] }),
  });
}

export function useColaboradores(funcoes?: string[]) {
  return useQuery({
    queryKey: ["colaboradores", funcoes?.join(",")],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (funcoes?.length) sp.set("funcoes", funcoes.join(","));
      const res = await fetch(`/api/colaboradores?${sp.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar colaboradores");
      return res.json();
    },
  });
}

export function useClientesSelect(q?: string) {
  return useQuery({
    queryKey: ["clientes-select", q],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      sp.set("pageSize", "100");
      const res = await fetch(`/api/clientes?${sp.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      return res.json();
    },
  });
}
