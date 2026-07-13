"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServicoInput, ServicoMaterialInput } from "@/lib/validations/servico";
import type { ResultadoCalculo } from "@/lib/orcamento/motor";

type ListParams = {
  q?: string;
  unidade?: string;
  ativo?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.unidade) sp.set("unidade", p.unidade);
  if (p.ativo) sp.set("ativo", p.ativo);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useServicos(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["servicos", params],
    queryFn: async () => {
      const res = await fetch(`/api/servicos?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar serviços");
      return res.json();
    },
  });
}

export function useServico(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["servico", id],
    queryFn: async () => {
      const res = await fetch(`/api/servicos/${id}`);
      if (!res.ok) throw new Error("Serviço não encontrado");
      return res.json();
    },
  });
}

export function useCreateServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ServicoInput) => {
      const res = await fetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar serviço");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicos"] }),
  });
}

export function useUpdateServico(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ServicoInput) => {
      const res = await fetch(`/api/servicos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar serviço");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      qc.invalidateQueries({ queryKey: ["servico", id] });
    },
  });
}

export function useDeleteServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/servicos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir serviço");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicos"] }),
  });
}

export function useAddServicoMaterial(servicoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ServicoMaterialInput) => {
      const res = await fetch(`/api/servicos/${servicoId}/materiais`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao adicionar material");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servico", servicoId] }),
  });
}

export function useRemoveServicoMaterial(servicoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (materialId: string) => {
      const res = await fetch(`/api/servicos/${servicoId}/materiais/${materialId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao remover material");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servico", servicoId] }),
  });
}

export function useCalcularServico(servicoId: string) {
  return useMutation({
    mutationFn: async (quantidade: number) => {
      const res = await fetch(`/api/servicos/${servicoId}/calcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao calcular");
      }
      return res.json() as Promise<ResultadoCalculo>;
    },
  });
}

export function useAplicarCalculoServico(servicoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (quantidade: number) => {
      const res = await fetch(`/api/servicos/${servicoId}/aplicar-calculo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao aplicar cálculo");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servico", servicoId] });
      qc.invalidateQueries({ queryKey: ["servicos"] });
    },
  });
}

export function useMateriais(q?: string) {
  return useQuery({
    queryKey: ["materiais", q],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      const res = await fetch(`/api/materiais?${sp.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar materiais");
      return res.json();
    },
  });
}
