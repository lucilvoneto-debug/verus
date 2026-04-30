"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MedicaoInput } from "@/lib/validations/medicao";
import type { Paginated } from "@/types";

export type MedicaoListItem = {
  id: string;
  numero: number;
  dataReferencia: string;
  percentualExecutado: number;
  valor: number;
  status: string;
  obra: { id: string; numero: string; nome: string };
};

type ListParams = {
  obraId?: string;
  status?: string;
  inicio?: string;
  fim?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.obraId) sp.set("obraId", p.obraId);
  if (p.status) sp.set("status", p.status);
  if (p.inicio) sp.set("inicio", p.inicio);
  if (p.fim) sp.set("fim", p.fim);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useMedicoes(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery<Paginated<MedicaoListItem>>({
    queryKey: ["medicoes", params],
    queryFn: async () => {
      const res = await fetch(`/api/medicoes?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar medições");
      return res.json();
    },
  });
}

export function useMedicao(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["medicao", id],
    queryFn: async () => {
      const res = await fetch(`/api/medicoes/${id}`);
      if (!res.ok) throw new Error("Medição não encontrada");
      return res.json();
    },
  });
}

export function useCreateMedicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: MedicaoInput) => {
      const res = await fetch("/api/medicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar medição");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicoes"] }),
  });
}

export function useMedicaoAcao(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (acao: "APROVAR" | "FATURAR") => {
      const res = await fetch(`/api/medicoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao executar ação");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicoes"] });
      qc.invalidateQueries({ queryKey: ["medicao", id] });
      qc.invalidateQueries({ queryKey: ["contas-receber"] });
    },
  });
}
