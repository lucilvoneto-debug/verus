"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChamadoInput } from "@/lib/validations/chamado";

type ListParams = {
  status?: string;
  clienteId?: string;
  garantiaId?: string;
  inicio?: string;
  fim?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.status) sp.set("status", p.status);
  if (p.clienteId) sp.set("clienteId", p.clienteId);
  if (p.garantiaId) sp.set("garantiaId", p.garantiaId);
  if (p.inicio) sp.set("inicio", p.inicio);
  if (p.fim) sp.set("fim", p.fim);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useChamados(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["chamados", params],
    queryFn: async () => {
      const res = await fetch(`/api/chamados?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar chamados");
      return res.json();
    },
  });
}

export function useChamado(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["chamado", id],
    queryFn: async () => {
      const res = await fetch(`/api/chamados/${id}`);
      if (!res.ok) throw new Error("Chamado não encontrado");
      return res.json();
    },
  });
}

export function useCreateChamado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ChamadoInput) => {
      const res = await fetch("/api/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar chamado");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chamados"] }),
  });
}

export function useChangeChamadoStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { status: string; custoReparo?: number }) => {
      const res = await fetch(`/api/chamados/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao alterar status");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chamados"] });
      qc.invalidateQueries({ queryKey: ["chamado", id] });
      qc.invalidateQueries({ queryKey: ["garantia"] });
    },
  });
}

export function useDeleteChamado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/chamados/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir chamado");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chamados"] }),
  });
}
