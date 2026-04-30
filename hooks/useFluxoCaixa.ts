"use client";

import { useQuery } from "@tanstack/react-query";

type Params = { inicio?: string; fim?: string };

export function useFluxoCaixa(params: Params) {
  const sp = new URLSearchParams();
  if (params.inicio) sp.set("inicio", params.inicio);
  if (params.fim) sp.set("fim", params.fim);
  return useQuery({
    queryKey: ["fluxo-caixa", params],
    queryFn: async () => {
      const res = await fetch(`/api/fluxo-caixa?${sp.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar fluxo de caixa");
      return res.json();
    },
  });
}
