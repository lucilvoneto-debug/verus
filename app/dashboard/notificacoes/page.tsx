"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Trash2, Check } from "lucide-react";
import {
  useDeleteNotificacao,
  useMarcarLida,
  useMarcarTodasLidas,
  useNotificacoes,
} from "@/hooks/useNotificacoes";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";

type Notificacao = {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link: string | null;
  lida: boolean;
  createdAt: string;
};

export default function NotificacoesPage() {
  const [filtro, setFiltro] = useState<"" | "false" | "true">("");
  const { data, isLoading } = useNotificacoes({ lida: filtro || undefined });
  const marcar = useMarcarLida();
  const marcarTodas = useMarcarTodasLidas();
  const del = useDeleteNotificacao();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Notificações</h2>
          <p className="text-sm text-gray-500">
            Central de avisos e alertas.{" "}
            {data?.naoLidas > 0 && (
              <Badge tone="red">{data.naoLidas} não lidas</Badge>
            )}
          </p>
        </div>
        <button
          className="btn-outline"
          disabled={marcarTodas.isPending || !data?.naoLidas}
          onClick={() => marcarTodas.mutate()}
        >
          <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
        </button>
      </div>

      <Card>
        <div className="flex gap-2 text-sm">
          <button
            className={`px-3 py-1 rounded ${filtro === "" ? "bg-brand text-white" : "bg-gray-100"}`}
            onClick={() => setFiltro("")}
          >
            Todas
          </button>
          <button
            className={`px-3 py-1 rounded ${filtro === "false" ? "bg-brand text-white" : "bg-gray-100"}`}
            onClick={() => setFiltro("false")}
          >
            Não lidas
          </button>
          <button
            className={`px-3 py-1 rounded ${filtro === "true" ? "bg-brand text-white" : "bg-gray-100"}`}
            onClick={() => setFiltro("true")}
          >
            Lidas
          </button>
        </div>
      </Card>

      <Card className="p-0">
        {isLoading && <div className="text-center text-gray-500 py-8">Carregando...</div>}
        {!isLoading && data?.data?.length === 0 && (
          <div className="text-center text-gray-500 py-12 flex flex-col items-center">
            <Bell className="w-10 h-10 text-gray-300 mb-2" />
            Nenhuma notificação.
          </div>
        )}
        <ul className="divide-y divide-gray-100">
          {data?.data?.map((n: Notificacao) => (
            <li key={n.id} className={`p-4 flex items-start gap-3 ${n.lida ? "" : "bg-brand-light/30"}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge tone="blue">{n.tipo}</Badge>
                  {!n.lida && <Badge tone="red">Nova</Badge>}
                  <span className="text-xs text-gray-500 ml-auto">{formatDateTime(n.createdAt)}</span>
                </div>
                <div className="font-medium text-brand-dark">{n.titulo}</div>
                <p className="text-sm text-gray-700 mt-0.5">{n.mensagem}</p>
                {n.link && (
                  <Link href={n.link} className="text-sm text-brand hover:underline mt-1 inline-block">
                    Abrir
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!n.lida && (
                  <button
                    onClick={() => marcar.mutate({ id: n.id, lida: true })}
                    className="p-2 rounded hover:bg-green-50 text-green-700"
                    title="Marcar como lida"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Excluir esta notificação?")) del.mutate(n.id);
                  }}
                  className="p-2 rounded hover:bg-red-50 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
