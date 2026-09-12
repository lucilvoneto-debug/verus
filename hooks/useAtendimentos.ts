"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AtendimentoInput } from "@/lib/validations/atendimento";

export type AtendimentoItem = {
  id: string;
  canal: string;
  descricao: string;
  urgencia: string;
  status: string;
  fotos: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: { id: string; nome: string; telefone: string | null; whatsapp: string | null; cidade: string | null };
  responsavel: { id: string; name: string };
  lead: { id: string; status: string; origem: string } | null;
  _count: { visitas: number };
};

type ListParams = {
  q?: string;
  status?: string;
  canal?: string;
  urgencia?: string;
  clienteId?: string;
  responsavelId?: string;
  abertos?: string;
  page?: number;
  pageSize?: number;
};

function qs(p: Record<string, unknown>) {
  const sp = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  });
  return sp.toString();
}

export function useAtendimentos(params: ListParams) {
  return useQuery<{ data: AtendimentoItem[]; total: number; page: number; totalPages: number; porStatus: Record<string, number> }>({
    queryKey: ["atendimentos", params],
    queryFn: async () => {
      const r = await fetch(`/api/atendimentos?${qs(params)}`);
      if (!r.ok) throw new Error("Erro ao carregar atendimentos");
      return r.json();
    },
  });
}

export function useAtendimento(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["atendimento", id],
    queryFn: async () => {
      const r = await fetch(`/api/atendimentos/${id}`);
      if (!r.ok) throw new Error("Não encontrado");
      return r.json();
    },
  });
}

export function useCreateAtendimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AtendimentoInput) => {
      const r = await fetch("/api/atendimentos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Erro ao criar atendimento");
      return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atendimentos"] }),
  });
}

export function useUpdateAtendimento(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<AtendimentoInput>) => {
      const r = await fetch(`/api/atendimentos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Erro ao atualizar");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["atendimentos"] });
      qc.invalidateQueries({ queryKey: ["atendimento", id] });
    },
  });
}

export function useDeleteAtendimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/atendimentos/${id}`, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Erro ao excluir");
      return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["atendimentos"] }),
  });
}
