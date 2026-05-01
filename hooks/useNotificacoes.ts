"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type NotificacoesParams = {
  lida?: string;
  naoLidas?: string;
  limit?: string;
  /** Quando definido, desabilita o polling/fetch. */
  _disabled?: string;
};

export function useNotificacoes(params: NotificacoesParams = {}) {
  const sp = new URLSearchParams();
  if (params.lida) sp.set("lida", params.lida);
  if (params.naoLidas) sp.set("naoLidas", params.naoLidas);
  if (params.limit) sp.set("limit", params.limit);
  const enabled = !params._disabled;
  return useQuery({
    queryKey: ["notificacoes", params],
    enabled,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
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
