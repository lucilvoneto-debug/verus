"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useColaboradores, useClientesSelect } from "@/hooks/useVisitas";
import { useServicos } from "@/hooks/useServicos";
import type { OrcamentoInput, OrcamentoItemInput } from "@/lib/validations/orcamento";
import { formatCurrency } from "@/lib/utils";

type Servico = {
  id: string;
  nome: string;
  unidade: string;
  custoPadrao: number;
  precoPadrao: number;
};

const unidadeLabel: Record<string, string> = {
  M2: "m²",
  METRO_LINEAR: "ml",
  DIARIA: "diária",
  UNIDADE: "un",
};

export function OrcamentoEditor({
  defaultValues,
  onSubmit,
  submitting,
  isEdit,
}: {
  defaultValues?: Partial<OrcamentoInput>;
  onSubmit: (data: OrcamentoInput) => void | Promise<void>;
  submitting?: boolean;
  isEdit?: boolean;
}) {
  const { data: clientes } = useClientesSelect();
  const { data: vendedores } = useColaboradores(["VENDEDOR"]);
  const { data: servicosResp } = useServicos({ pageSize: 200, ativo: "true" });
  const servicos: Servico[] = servicosResp?.data ?? [];

  const [clienteId, setClienteId] = useState(defaultValues?.clienteId ?? "");
  const [visitaId, setVisitaId] = useState(defaultValues?.visitaId ?? "");
  const [vendedorId, setVendedorId] = useState(defaultValues?.vendedorId ?? "");
  const [dataValidade, setDataValidade] = useState(defaultValues?.dataValidade ?? "");
  const [condicaoPagamento, setCondicaoPagamento] = useState(
    defaultValues?.condicaoPagamento ?? ""
  );
  const [prazoExecucao, setPrazoExecucao] = useState(defaultValues?.prazoExecucao ?? "");
  const [observacoes, setObservacoes] = useState(defaultValues?.observacoes ?? "");
  const [desconto, setDesconto] = useState<number>(defaultValues?.desconto ?? 0);
  const [itens, setItens] = useState<OrcamentoItemInput[]>(
    defaultValues?.itens ?? []
  );

  // pré-seleciona vendedor padrão quando lista carrega
  useEffect(() => {
    if (!vendedorId && vendedores?.data?.length) {
      const v = vendedores.data.find((c: { userId: string | null }) => c.userId);
      if (v?.userId) setVendedorId(v.userId);
    }
  }, [vendedores, vendedorId]);

  function addItem() {
    setItens((prev) => [
      ...prev,
      {
        servicoId: "",
        descricao: "",
        area: undefined,
        quantidade: 1,
        unidade: "UNIDADE",
        custoUnit: 0,
        precoUnit: 0,
        subtotal: 0,
      },
    ]);
  }

  function updateItem(idx: number, patch: Partial<OrcamentoItemInput>) {
    setItens((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...it, ...patch };
        merged.subtotal = +(merged.quantidade * merged.precoUnit).toFixed(2);
        return merged;
      })
    );
  }

  function removeItem(idx: number) {
    setItens((prev) => prev.filter((_, i) => i !== idx));
  }

  function selecionarServico(idx: number, servicoId: string) {
    const s = servicos.find((x) => x.id === servicoId);
    if (!s) {
      updateItem(idx, { servicoId: "" });
      return;
    }
    updateItem(idx, {
      servicoId: s.id,
      descricao: itens[idx]?.descricao || s.nome,
      unidade: s.unidade,
      custoUnit: s.custoPadrao,
      precoUnit: s.precoPadrao,
    });
  }

  const totals = useMemo(() => {
    const subtotal = itens.reduce((s, it) => s + it.quantidade * it.precoUnit, 0);
    const total = Math.max(0, subtotal - (desconto || 0));
    const custoEstimado = itens.reduce((s, it) => s + it.quantidade * it.custoUnit, 0);
    const margemPrevista = total > 0 ? ((total - custoEstimado) / total) * 100 : 0;
    return { subtotal, total, custoEstimado, margemPrevista };
  }, [itens, desconto]);

  async function handleSubmit(status: "RASCUNHO" | "ENVIADO") {
    if (!clienteId) return alert("Selecione o cliente");
    if (!vendedorId) return alert("Selecione o vendedor");
    if (!dataValidade) return alert("Informe a validade");
    if (itens.length === 0) return alert("Adicione ao menos um item");
    for (const it of itens) {
      if (!it.servicoId) return alert("Selecione o serviço de todos os itens");
      if (it.quantidade <= 0) return alert("Quantidade inválida em algum item");
    }
    const payload: OrcamentoInput = {
      clienteId,
      visitaId: visitaId || undefined,
      vendedorId,
      dataValidade,
      status,
      desconto: Number(desconto) || 0,
      condicaoPagamento,
      prazoExecucao,
      observacoes,
      itens: itens.map((it) => ({
        ...it,
        subtotal: +(it.quantidade * it.precoUnit).toFixed(2),
      })),
    };
    await onSubmit(payload);
  }

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Cabeçalho</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <select
              className="input-verus"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {clientes?.data?.map((c: { id: string; nome: string }) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Vendedor</label>
            <select
              className="input-verus"
              value={vendedorId}
              onChange={(e) => setVendedorId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {vendedores?.data?.map(
                (c: { id: string; nome: string; userId: string | null }) =>
                  c.userId && (
                    <option key={c.id} value={c.userId}>
                      {c.nome}
                    </option>
                  )
              )}
            </select>
          </div>
          <Input
            label="Validade"
            type="date"
            value={dataValidade}
            onChange={(e) => setDataValidade(e.target.value)}
          />
          <Input
            label="Visita vinculada (ID)"
            value={visitaId ?? ""}
            onChange={(e) => setVisitaId(e.target.value)}
            placeholder="opcional"
          />
          <Input
            label="Condição de pagamento"
            value={condicaoPagamento ?? ""}
            onChange={(e) => setCondicaoPagamento(e.target.value)}
            placeholder="Ex.: 30/60/90"
          />
          <Input
            label="Prazo de execução"
            value={prazoExecucao ?? ""}
            onChange={(e) => setPrazoExecucao(e.target.value)}
            placeholder="Ex.: 15 dias úteis"
          />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Itens</h3>
          <button onClick={addItem} className="btn-outline">
            <Plus className="w-4 h-4" /> Adicionar item
          </button>
        </div>

        {itens.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">
            Nenhum item. Clique em &ldquo;Adicionar item&rdquo;.
          </p>
        )}

        <div className="space-y-3">
          {itens.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 rounded border border-gray-200"
            >
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs text-gray-500">Serviço</label>
                <select
                  className="input-verus"
                  value={it.servicoId}
                  onChange={(e) => selecionarServico(idx, e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs text-gray-500">Descrição</label>
                <input
                  className="input-verus"
                  value={it.descricao}
                  onChange={(e) => updateItem(idx, { descricao: e.target.value })}
                />
              </div>
              <div className="md:col-span-1 space-y-1">
                <label className="text-xs text-gray-500">
                  Qtd ({unidadeLabel[it.unidade] ?? it.unidade})
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-verus"
                  value={it.quantidade}
                  onChange={(e) =>
                    updateItem(idx, { quantidade: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-gray-500">Custo unit.</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-verus"
                  value={it.custoUnit}
                  onChange={(e) =>
                    updateItem(idx, { custoUnit: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-gray-500">Preço unit.</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-verus"
                  value={it.precoUnit}
                  onChange={(e) =>
                    updateItem(idx, { precoUnit: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="md:col-span-1 flex items-end justify-end">
                <button
                  onClick={() => removeItem(idx)}
                  className="p-2 rounded hover:bg-red-50 text-red-600"
                  aria-label="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="md:col-span-12 text-right text-sm text-gray-600">
                Subtotal: <strong>{formatCurrency(it.quantidade * it.precoUnit)}</strong>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Totais</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Desconto (R$)</label>
            <input
              type="number"
              step="0.01"
              className="input-verus"
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value) || 0)}
            />
          </div>
          <Field label="Total" value={formatCurrency(totals.total)} highlight />
          <Field
            label="Custo estimado"
            value={formatCurrency(totals.custoEstimado)}
          />
          <Field
            label="Margem prevista"
            value={`${totals.margemPrevista.toFixed(1)}%`}
            highlight
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            rows={3}
            className="input-verus"
            value={observacoes ?? ""}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => handleSubmit("RASCUNHO")}
          disabled={submitting}
          className="btn-outline"
        >
          Salvar rascunho
        </button>
        <button
          onClick={() => handleSubmit("ENVIADO")}
          disabled={submitting}
          className="btn-primary"
        >
          {isEdit ? "Salvar e enviar" : "Enviar"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div
        className={
          highlight
            ? "font-display text-lg font-semibold text-brand-dark"
            : "text-gray-900"
        }
      >
        {value}
      </div>
    </div>
  );
}
