"use client";

import { useState } from "react";
import { Plus, DollarSign, Trash2, Pencil } from "lucide-react";
import {
  useContasReceber,
  useCreateContaReceber,
  useDeleteContaReceber,
  useReceberConta,
  useUpdateContaReceber,
} from "@/hooks/useContasReceber";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ContaReceberFormModal } from "./ContaReceberFormModal";
import { PagamentoModal } from "./PagamentoModal";
import type { ContaReceberInput } from "@/lib/validations/contaReceber";

type Conta = {
  id: string;
  descricao: string;
  valor: number;
  valorPago: number;
  vencimento: string;
  status: string;
  statusComputed: string;
  cliente: { id: string; nome: string };
  contratoId: string | null;
  obraId: string | null;
  obra?: { id: string; numero: string; nome: string } | null;
  observacoes: string | null;
};

const statusTone = (s: string) =>
  s === "PAGA" ? "green" : s === "PARCIAL" ? "yellow" : s === "ATRASADA" ? "red" : "neutral";

export function ContasReceberTab() {
  const [status, setStatus] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [openNova, setOpenNova] = useState(false);
  const [editando, setEditando] = useState<Conta | null>(null);
  const [recebendo, setRecebendo] = useState<Conta | null>(null);

  const { data, isLoading } = useContasReceber({ status, inicio, fim, pageSize: 100 });
  const create = useCreateContaReceber();
  const update = useUpdateContaReceber(editando?.id ?? "");
  const del = useDeleteContaReceber();
  const receber = useReceberConta();


  async function handleDelete(id: string, descricao: string) {
    if (!confirm(`Excluir conta "${descricao}"?`)) return;
    try {
      await del.mutateAsync(id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="input-verus" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ABERTA">Aberta</option>
            <option value="PAGA">Paga</option>
            <option value="ATRASADA">Atrasada</option>
            <option value="PARCIAL">Parcial</option>
          </select>
          <input
            type="date"
            className="input-verus"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            placeholder="Início"
          />
          <input
            type="date"
            className="input-verus"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            placeholder="Fim"
          />
          <button onClick={() => setOpenNova(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nova
          </button>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Pago</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">
                    Carregando...
                  </td>
                </tr>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">
                    Nenhuma conta encontrada.
                  </td>
                </tr>
              )}
              {data?.data?.map((c: Conta) => {
                const saldo = c.valor - c.valorPago;
                return (
                  <tr key={c.id}>
                    <td className="font-medium">{c.cliente.nome}</td>
                    <td>
                      {c.descricao}
                      {c.obra && (
                        <span className="text-xs text-gray-500 ml-2">
                          · Obra {c.obra.numero}
                        </span>
                      )}
                    </td>
                    <td className="tabular-nums">{formatCurrency(c.valor)}</td>
                    <td className="tabular-nums text-gray-600">{formatCurrency(c.valorPago)}</td>
                    <td>{formatDate(c.vencimento)}</td>
                    <td>
                      <Badge tone={statusTone(c.statusComputed)}>{c.statusComputed}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        {c.status !== "PAGA" && (
                          <button
                            onClick={() => setRecebendo(c)}
                            className="p-2 rounded hover:bg-green-50 text-green-700"
                            aria-label="Receber"
                            title="Receber"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditando(c)}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.descricao)}
                          className="p-2 rounded hover:bg-red-50 text-red-600"
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <ContaReceberFormModal
        open={openNova}
        onClose={() => setOpenNova(false)}
        submitting={create.isPending}
        onSubmit={async (d) => {
          try {
            await create.mutateAsync(d);
            setOpenNova(false);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />

      <ContaReceberFormModal
        open={!!editando}
        onClose={() => setEditando(null)}
        title="Editar conta a receber"
        submitting={update.isPending}
        defaultValues={
          editando
            ? ({
                clienteId: editando.cliente.id,
                contratoId: editando.contratoId ?? "",
                obraId: editando.obraId ?? "",
                descricao: editando.descricao,
                valor: editando.valor,
                vencimento: editando.vencimento.slice(0, 10),
                status: editando.status as ContaReceberInput["status"],
                observacoes: editando.observacoes ?? "",
              } as Partial<ContaReceberInput>)
            : undefined
        }
        onSubmit={async (d) => {
          if (!editando) return;
          try {
            await update.mutateAsync(d);
            setEditando(null);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />

      <PagamentoModal
        open={!!recebendo}
        onClose={() => setRecebendo(null)}
        title={`Receber: ${recebendo?.descricao ?? ""}`}
        acaoLabel="Confirmar recebimento"
        saldo={recebendo ? recebendo.valor - recebendo.valorPago : 0}
        submitting={receber.isPending}
        onSubmit={async (d) => {
          if (!recebendo) return;
          try {
            await receber.mutateAsync({ id: recebendo.id, data: d });
            setRecebendo(null);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        }}
      />
    </div>
  );
}
