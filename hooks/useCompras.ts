"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PedidoCompraInput } from "@/lib/validations/pedidoCompra";

type ListParams = { q?: string; status?: string; fornecedorId?: string; page?: number; pageSize?: number };

function buildQuery(p: ListParams) {
  const sp = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) sp.set(k, String(v));
  });
  return sp.toString();
}

export function useCompras(params: ListParams) {
  const qs = buildQuery(params);
  return useQuery({
    queryKey: ["compras", params],
    queryFn: async () => {
      const res = await fetch(`/api/compras?${qs}`);
      if (!res.ok) throw new Error("Erro ao carregar pedidos");
      return res.json();
    },
  });
}

export function useCompra(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ["compra", id],
    queryFn: async () => {
      const res = await fetch(`/api/compras/${id}`);
      if (!res.ok) throw new Error("Não encontrado");
      return res.json();
    },
  });
}

export function useCreateCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PedidoCompraInput) => {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao criar pedido");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

export function useUpdateCompra(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PedidoCompraInput) => {
      const res = await fetch(`/api/compras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Erro ao atualizar");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compras"] });
      qc.invalidateQueries({ queryKey: ["compra", id] });
    },
  });
}

export function useDeleteCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/compras/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compras"] }),
  });
}

function makeAction(action: "enviar" | "receber" | "cancelar") {
  return function useAction() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const res = await fetch(`/api/compras/${id}/${action}`, { method: "POST" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Erro");
        }
        return res.json();
      },
      onSuccess: (_d, id) => {
        qc.invalidateQueries({ queryKey: ["compras"] });
        qc.invalidateQueries({ queryKey: ["compra", id] });
        qc.invalidateQueries({ queryKey: ["materiais"] });
        qc.invalidateQueries({ queryKey: ["movimentacoes"] });
      },
    });
  };
}

export const useEnviarCompra = makeAction("enviar");
export const useReceberCompra = makeAction("receber");
export const useCancelarCompra = makeAction("cancelar");
