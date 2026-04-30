"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useNotificacoes(params: { lida?: string } = {}) {
  const sp = new URLSearchParams();
  if (params.lida) sp.set("lida", params.lida);
  return useQuery({
    queryKey: ["notificacoes", params],
    queryFn: async () => {
      const res = await fetch(`/api/notificacoes?${sp.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar notificações");
      return res.json();
    },
  });
}

export function useMarcarLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, lida = true }: { id: string; lida?: boolean }) => {
      const res = await fetch(`/api/notificacoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lida }),
      });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
}

export function useMarcarTodasLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notificacoes/marcar-todas`, { method: "POST" });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
}

export function useDeleteNotificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notificacoes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificacoes"] }),
  });
}
