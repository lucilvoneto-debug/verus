"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ClienteInput } from "@/lib/validations/cliente";
import type { ClienteListItem, Paginated } from "@/types";

type ListParams = {
  q?: string;
  tipo?: string;
  categoria?: string;
  page?: number;
  pageSize?: number;
};

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.tipo) sp.set("tipo", p.tipo);
  if (p.categoria) sp.set("categoria", p.categoria);
  if (p.page) sp.set("page", String(p.page));
  if (p.pageSize) sp.set("pageSize", String(p.pageSize));
  return sp.toString();
}

export function useClientes(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery<Paginated<ClienteListItem>>({
    queryKey: ["clientes", params],
    queryFn: async () => {
      const res = await fetch(`/api/clientes?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      return res.json();
    },
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["cliente", id],
    queryFn: async () => {
      const res = await fetch(`/api/clientes/${id}`);
      if (!res.ok) throw new Error("Cliente não encontrado");
      return res.json();
    },
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ClienteInput) => {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar cliente");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });
}

export function useUpdateCliente(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: ClienteInput) => {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar cliente");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      qc.invalidateQueries({ queryKey: ["cliente", id] });
    },
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir cliente");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clientes"] }),
  });
}
