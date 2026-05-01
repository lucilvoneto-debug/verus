"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { pedidoCompraSchema, type PedidoCompraInput } from "@/lib/validations/pedidoCompra";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils";

type Fornecedor = { id: string; nome: string };
type Material = { id: string; nome: string; unidade: string; custoMedio: number };

export function PedidoCompraForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar pedido",
}: {
  defaultValues?: Partial<PedidoCompraInput>;
  onSubmit: (data: PedidoCompraInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);

  useEffect(() => {
    fetch("/api/fornecedores?pageSize=200&ativo=true")
      .then((r) => r.json())
      .then((j) => setFornecedores(j.data ?? []));
    fetch("/api/materiais?pageSize=200&ativo=true")
      .then((r) => r.json())
      .then((j) => setMateriais(j.data ?? []));
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PedidoCompraInput>({
    resolver: zodResolver(pedidoCompraSchema),
    defaultValues: {
      itens: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  const itens = watch("itens");
  const total = (itens ?? []).reduce((s, i) => s + (Number(i.subtotal) || 0), 0);

  function recalcSubtotal(idx: number) {
    const it = itens[idx];
    const sub = (Number(it.quantidade) || 0) * (Number(it.custoUnit) || 0);
    setValue(`itens.${idx}.subtotal`, Math.round(sub * 100) / 100);
  }

  function onMaterialChange(idx: number, materialId: string) {
    const m = materiais.find((x) => x.id === materialId);
    if (m) {
      setValue(`itens.${idx}.custoUnit`, m.custoMedio);
      recalcSubtotal(idx);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Cabeçalho</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Fornecedor"
            {...register("fornecedorId")}
            options={[
              { value: "", label: "Selecione..." },
              ...fornecedores.map((f) => ({ value: f.id, label: f.nome })),
            ]}
          />
          <Input label="Data do pedido" type="date" {...register("dataPedido")} error={errors.dataPedido?.message} />
          <Input label="Previsão de entrega" type="date" {...register("dataPrevista")} error={errors.dataPrevista?.message} />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea {...register("observacoes")} rows={3} className="input-verus" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Itens</h3>
          <button
            type="button"
            className="btn-outline"
            onClick={() =>
              append({ materialId: "", quantidade: 1, custoUnit: 0, subtotal: 0 })
            }
          >
            <Plus className="w-4 h-4" /> Adicionar item
          </button>
        </div>

        {errors.itens && (
          <p className="text-xs text-danger mb-2">{errors.itens.message as string}</p>
        )}

        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantidade</th>
                <th>Custo unit.</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-500 py-6">Adicione itens.</td></tr>
              )}
              {fields.map((field, idx) => (
                <tr key={field.id}>
                  <td>
                    <select
                      className="input-verus"
                      {...register(`itens.${idx}.materialId`, {
                        onChange: (e) => onMaterialChange(idx, e.target.value),
                      })}
                    >
                      <option value="">Selecione...</option>
                      {materiais.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nome} ({m.unidade})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="w-32">
                    <input
                      className="input-verus"
                      type="number"
                      step="0.01"
                      {...register(`itens.${idx}.quantidade`, {
                        valueAsNumber: true,
                        onChange: () => recalcSubtotal(idx),
                      })}
                    />
                  </td>
                  <td className="w-36">
                    <input
                      className="input-verus"
                      type="number"
                      step="0.01"
                      {...register(`itens.${idx}.custoUnit`, {
                        valueAsNumber: true,
                        onChange: () => recalcSubtotal(idx),
                      })}
                    />
                  </td>
                  <td className="tabular-nums">
                    {formatCurrency(Number(itens?.[idx]?.subtotal) || 0)}
                    <input type="hidden" {...register(`itens.${idx}.subtotal`, { valueAsNumber: true })} />
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-2 rounded hover:bg-red-50 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="text-right font-medium">Total</td>
                <td className="font-display text-lg font-bold tabular-nums">{formatCurrency(total)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
