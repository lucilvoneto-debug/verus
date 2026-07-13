"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrcamentoInput } from "@/lib/validations/orcamento";
import type { ResultadoCalculo } from "@/lib/orcamento/motor";

type ListParams = {
  q?: string;
  status?: string;
  vendedorId?: string;
  dataIni?: string;
  dataFim?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.status) sp.set("status", p.status);
  if (p.vendedorId) sp.set("vendedorId", p.vendedorId);
  if (p.dataIni) sp.set("dataIni", p.dataIni);
  if (p.dataFim) sp.set("dataFim", p.dataFim);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useOrcamentos(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["orcamentos", params],
    queryFn: async () => {
      const res = await fetch(`/api/orcamento?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar orçamentos");
      return res.json();
    },
  });
}

export function useOrcamento(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["orcamento", id],
    queryFn: async () => {
      const res = await fetch(`/api/orcamento/${id}`);
      if (!res.ok) throw new Error("Orçamento não encontrado");
      return res.json();
    },
  });
}

export function useCreateOrcamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: OrcamentoInput) => {
      const res = await fetch("/api/orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar orçamento");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orcamentos"] }),
  });
}

export function useUpdateOrcamento(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: OrcamentoInput) => {
      const res = await fetch(`/api/orcamento/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar orçamento");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orcamentos"] });
      qc.invalidateQueries({ queryKey: ["orcamento", id] });
    },
  });
}

export function useDeleteOrcamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orcamento/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir orçamento");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orcamentos"] }),
  });
}

export function useChangeOrcamentoStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/orcamento/${id}/aprovar`, {
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
      qc.invalidateQueries({ queryKey: ["orcamentos"] });
      qc.invalidateQueries({ queryKey: ["orcamento", id] });
    },
  });
}

export type MotorOrcamentoResposta = {
  servico: { id: string; nome: string; unidade: string };
  resultado: ResultadoCalculo;
};

export function useMotorOrcamento() {
  return useMutation({
    mutationFn: async (input: { servicoId: string; quantidade: number }) => {
      const res = await fetch("/api/orcamento/motor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao calcular");
      }
      return res.json() as Promise<MotorOrcamentoResposta>;
    },
  });
}

export function useGerarContrato(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/orcamento/${id}/gerar-contrato`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao gerar contrato");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orcamento", id] });
      qc.invalidateQueries({ queryKey: ["contratos"] });
    },
  });
}
