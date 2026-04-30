"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ContratoInput } from "@/lib/validations/contrato";

type ListParams = {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.status) sp.set("status", p.status);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useContratos(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["contratos", params],
    queryFn: async () => {
      const res = await fetch(`/api/contratos?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar contratos");
      return res.json();
    },
  });
}

export function useContrato(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["contrato", id],
    queryFn: async () => {
      const res = await fetch(`/api/contratos/${id}`);
      if (!res.ok) throw new Error("Contrato não encontrado");
      return res.json();
    },
  });
}

export function useCreateContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ContratoInput) => {
      const res = await fetch("/api/contratos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar contrato");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contratos"] }),
  });
}

export function useUpdateContrato(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ContratoInput) => {
      const res = await fetch(`/api/contratos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar contrato");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] });
      qc.invalidateQueries({ queryKey: ["contrato", id] });
    },
  });
}

export function useDeleteContrato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/contratos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir contrato");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contratos"] }),
  });
}

export function useChangeContratoStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/contratos/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao alterar status");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contratos"] });
      qc.invalidateQueries({ queryKey: ["contrato", id] });
    },
  });
}

export function useGerarObra(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/contratos/${id}/gerar-obra`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao gerar obra");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contrato", id] });
      qc.invalidateQueries({ queryKey: ["obras"] });
    },
  });
}

export function useOrcamentosAprovados() {
  return useQuery({
    queryKey: ["orcamentos-aprovados"],
    queryFn: async () => {
      const res = await fetch(`/api/orcamento?status=APROVADO&pageSize=100`);
      if (!res.ok) throw new Error("Erro ao carregar orçamentos");
      return res.json();
    },
  });
}
