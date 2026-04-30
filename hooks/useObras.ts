"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ObraInput, DiarioObraInput, AlocacaoEquipeInput } from "@/lib/validations/obra";
import type { Paginated } from "@/types";

export type ObraListItem = {
  id: string;
  numero: string;
  nome: string;
  status: string;
  dataInicio: string;
  previsaoTermino: string;
  cliente: { id: string; nome: string };
  responsavel: { id: string; name: string } | null;
  etapasTotal: number;
  etapasConcluidas: number;
  progresso: number;
};

type ListParams = {
  q?: string;
  status?: string;
  responsavelId?: string;
  inicio?: string;
  fim?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.status) sp.set("status", p.status);
  if (p.responsavelId) sp.set("responsavelId", p.responsavelId);
  if (p.inicio) sp.set("inicio", p.inicio);
  if (p.fim) sp.set("fim", p.fim);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useObras(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery<Paginated<ObraListItem>>({
    queryKey: ["obras", params],
    queryFn: async () => {
      const res = await fetch(`/api/obras?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar obras");
      return res.json();
    },
  });
}

export function useObra(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["obra", id],
    queryFn: async () => {
      const res = await fetch(`/api/obras/${id}`);
      if (!res.ok) throw new Error("Obra não encontrada");
      return res.json();
    },
  });
}

export function useObrasLite() {
  return useQuery<{ data: { id: string; numero: string; nome: string; status: string; contratoId: string; clienteId: string; contrato: { valor: number } | null }[] }>({
    queryKey: ["obras-lite"],
    queryFn: async () => {
      const res = await fetch(`/api/obras/lite`);
      if (!res.ok) throw new Error("Erro ao carregar obras");
      return res.json();
    },
  });
}

export function useContratosDisponiveis() {
  return useQuery<{ data: { id: string; numero: string; valor: number; clienteId: string; cliente: { id: string; nome: string } }[] }>({
    queryKey: ["contratos-disponiveis"],
    queryFn: async () => {
      const res = await fetch(`/api/obras/contratos-disponiveis`);
      if (!res.ok) throw new Error("Erro ao carregar contratos");
      return res.json();
    },
  });
}

export function useColaboradoresPorFuncao(funcoes: string[]) {
  return useQuery<{ data: { id: string; nome: string; funcao: string; userId: string | null }[] }>({
    queryKey: ["colaboradores", funcoes],
    queryFn: async () => {
      const qs = funcoes.length ? `?funcoes=${funcoes.join(",")}` : "";
      const res = await fetch(`/api/colaboradores${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar colaboradores");
      return res.json();
    },
  });
}

export function useCreateObra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ObraInput) => {
      const res = await fetch("/api/obras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar obra");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obras"] });
      qc.invalidateQueries({ queryKey: ["obras-lite"] });
      qc.invalidateQueries({ queryKey: ["contratos-disponiveis"] });
    },
  });
}

export function useUpdateObra(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ObraInput) => {
      const res = await fetch(`/api/obras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar obra");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obras"] });
      qc.invalidateQueries({ queryKey: ["obra", id] });
    },
  });
}

export function useUpdateObraStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/obras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["obras"] });
      qc.invalidateQueries({ queryKey: ["obra", id] });
    },
  });
}

export function useDeleteObra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/obras/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir obra");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obras"] }),
  });
}

export function useCreateDiario(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: DiarioObraInput) => {
      const res = await fetch(`/api/obras/${obraId}/diario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao registrar diário");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obra", obraId] }),
  });
}

export function useCreateAlocacao(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AlocacaoEquipeInput) => {
      const res = await fetch(`/api/obras/${obraId}/equipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao alocar");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obra", obraId] }),
  });
}

export function useDeleteAlocacao(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alocacaoId: string) => {
      const res = await fetch(`/api/obras/${obraId}/equipe?alocacaoId=${alocacaoId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao remover alocação");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obra", obraId] }),
  });
}
