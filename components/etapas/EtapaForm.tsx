"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { etapaSchema, type EtapaInput } from "@/lib/validations/etapa";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { useObrasLite, useColaboradoresPorFuncao } from "@/hooks/useObras";

const statusOpts = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "ATRASADA", label: "Atrasada" },
];

export function EtapaForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<EtapaInput>;
  onSubmit: (data: EtapaInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const obrasQ = useObrasLite();
  const colabsQ = useColaboradoresPorFuncao([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EtapaInput>({
    resolver: zodResolver(etapaSchema),
    defaultValues: {
      status: "PENDENTE",
      checklist: [],
      fotos: [],
      ordem: 1,
      ...defaultValues,
    },
  });

  const obraOpts = useMemo(() => {
    const opts =
      obrasQ.data?.data.map((o) => ({
        value: o.id,
        label: `${o.numero} · ${o.nome}`,
      })) ?? [];
    return [{ value: "", label: "Selecione..." }, ...opts];
  }, [obrasQ.data]);

  const respOpts = useMemo(() => {
    const opts =
      colabsQ.data?.data
        .filter((c) => c.userId)
        .map((c) => ({ value: c.userId as string, label: `${c.nome} · ${c.funcao}` })) ?? [];
    return [{ value: "", label: "(sem responsável)" }, ...opts];
  }, [colabsQ.data]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Identificação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Obra" options={obraOpts} {...register("obraId")} error={errors.obraId?.message} />
          <Input label="Nome da etapa" {...register("nome")} error={errors.nome?.message} />
          <Input label="Ordem" type="number" min={1} {...register("ordem")} error={errors.ordem?.message} />
          <Select label="Status" options={statusOpts} {...register("status")} />
          <Input
            label="Data prevista"
            type="date"
            {...register("dataPrevista")}
            error={errors.dataPrevista?.message}
          />
          <Select label="Responsável" options={respOpts} {...register("responsavelId")} />
        </div>
        <div className="mt-4 space-y-1">
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea {...register("descricao")} rows={2} className="input-impermeia" />
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Checklist</h3>
        <Controller
          control={control}
          name="checklist"
          render={({ field }) => <ChecklistEditor value={field.value ?? []} onChange={field.onChange} />}
        />
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Fotos (URLs)</h3>
        <Controller
          control={control}
          name="fotos"
          render={({ field }) => <FotosEditor value={field.value ?? []} onChange={field.onChange} />}
        />
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Observações</h3>
        <textarea {...register("observacoes")} rows={3} className="input-impermeia" />
      </Card>

      <div className="flex items-center justify-end gap-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

function ChecklistEditor({
  value,
  onChange,
}: {
  value: { nome: string; done: boolean }[];
  onChange: (v: { nome: string; done: boolean }[]) => void;
}) {
  const [novo, setNovo] = useState("");

  function add() {
    const nome = novo.trim();
    if (!nome) return;
    onChange([...(value ?? []), { nome, done: false }]);
    setNovo("");
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function toggle(i: number) {
    onChange(value.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it)));
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-sm text-gray-500">Nenhum item.</p>}
      <ul className="space-y-2">
        {value.map((it, i) => (
          <li key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
            <input
              type="checkbox"
              checked={it.done}
              onChange={() => toggle(i)}
              className="w-4 h-4 accent-brand"
            />
            <span className={it.done ? "line-through text-gray-400 flex-1" : "flex-1"}>{it.nome}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input-impermeia flex-1"
          placeholder="Novo item..."
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} className="btn-outline">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>
    </div>
  );
}

function FotosEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [url, setUrl] = useState("");
  function add() {
    const u = url.trim();
    if (!u) return;
    onChange([...(value ?? []), u]);
    setUrl("");
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-sm text-gray-500">Nenhuma foto.</p>}
      <ul className="space-y-2">
        {value.map((u, i) => (
          <li key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
            <span className="flex-1 text-sm truncate">{u}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="input-impermeia flex-1"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" onClick={add} className="btn-outline">
          <Plus className="w-4 h-4" /> Adicionar URL
        </button>
      </div>
    </div>
  );
}
