"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Calculator, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useServico,
  useAddServicoMaterial,
  useRemoveServicoMaterial,
  useMateriais,
  useCalcularServico,
  useAplicarCalculoServico,
} from "@/hooks/useServicos";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ResultadoCalculo } from "@/lib/orcamento/motor";

const unidadeLabel: Record<string, string> = {
  M2: "m²",
  METRO_LINEAR: "metro linear",
  DIARIA: "diária",
  UNIDADE: "unidade",
};

export default function ServicoDetalhePage() {
  const params = useParams<{ id: string }>();
  const { data: servico, isLoading } = useServico(params.id);

  if (isLoading) return <div className="text-gray-500">Carregando...</div>;
  if (!servico) return <div className="text-gray-500">Serviço não encontrado.</div>;

  const margem =
    servico.precoPadrao > 0
      ? ((servico.precoPadrao - servico.custoPadrao) / servico.precoPadrao) * 100
      : 0;

  const dados = (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <Field label="Nome" value={servico.nome} />
        <Field label="Unidade" value={unidadeLabel[servico.unidade] ?? servico.unidade} />
        <Field label="Custo padrão" value={formatCurrency(servico.custoPadrao)} />
        <Field label="Preço padrão" value={formatCurrency(servico.precoPadrao)} />
        <Field label="Margem prevista" value={`${margem.toFixed(1)}%`} />
        <Field
          label="Tempo médio"
          value={servico.tempoMedio != null ? `${servico.tempoMedio} h` : "—"}
        />
        <Field label="Status" value={servico.ativo ? "Ativo" : "Inativo"} />
        <Field label="Cadastrado em" value={formatDate(servico.createdAt)} />
      </div>
      {servico.descricao && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Descrição</div>
          <p className="text-sm whitespace-pre-wrap">{servico.descricao}</p>
        </div>
      )}
      {servico.observacoesTecnicas && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
            Observações técnicas
          </div>
          <p className="text-sm whitespace-pre-wrap">{servico.observacoesTecnicas}</p>
        </div>
      )}
    </Card>
  );

  const materiais = <MateriaisTab servicoId={servico.id} materiais={servico.materiais} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/servicos" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-brand-dark">{servico.nome}</h2>
          <p className="text-sm text-gray-500">
            {unidadeLabel[servico.unidade] ?? servico.unidade} ·{" "}
            {formatCurrency(servico.precoPadrao)}{" "}
            <Badge tone={servico.ativo ? "green" : "neutral"}>
              {servico.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </p>
        </div>
        <Link href={`/dashboard/servicos/${servico.id}/editar`} className="btn-outline">
          <Pencil className="w-4 h-4" /> Editar
        </Link>
      </div>

      <Tabs
        items={[
          { key: "dados", label: "Dados", content: dados },
          {
            key: "mat",
            label: `Materiais (${servico.materiais.length})`,
            content: materiais,
          },
        ]}
      />
    </div>
  );
}

function MateriaisTab({
  servicoId,
  materiais,
}: {
  servicoId: string;
  materiais: Array<{
    id: string;
    materialId: string;
    quantidade: number;
    material: { id: string; nome: string; unidade: string; custoMedio: number };
  }>;
}) {
  const { data: matList } = useMateriais();
  const add = useAddServicoMaterial(servicoId);
  const remove = useRemoveServicoMaterial(servicoId);
  const [materialId, setMaterialId] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  async function handleAdd() {
    if (!materialId) {
      alert("Selecione um material");
      return;
    }
    const q = Number(quantidade);
    if (!q || q <= 0) {
      alert("Quantidade inválida");
      return;
    }
    try {
      await add.mutateAsync({ materialId, quantidade: q });
      setMaterialId("");
      setQuantidade("1");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleRemove(mid: string) {
    if (!confirm("Remover este material da BOM?")) return;
    try {
      await remove.mutateAsync(mid);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-4">
      <RecalcularCard servicoId={servicoId} temMateriais={materiais.length > 0} />

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Adicionar material</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <select
              className="input-verus"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {matList?.data?.map(
                (m: { id: string; nome: string; unidade: string; custoMedio: number }) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.unidade}) · {formatCurrency(m.custoMedio)}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="number"
              step="0.01"
              className="input-verus"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button onClick={handleAdd} disabled={add.isPending} className="btn-primary">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Material</th>
                <th>Unidade</th>
                <th>Quantidade</th>
                <th>Custo unit.</th>
                <th>Custo total</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {materiais.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhum material vinculado.
                  </td>
                </tr>
              )}
              {materiais.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.material.nome}</td>
                  <td>{m.material.unidade}</td>
                  <td className="tabular-nums">{m.quantidade}</td>
                  <td>{formatCurrency(m.material.custoMedio)}</td>
                  <td>{formatCurrency(m.material.custoMedio * m.quantidade)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1 pr-2">
                      <button
                        onClick={() => handleRemove(m.materialId)}
                        className="p-2 rounded hover:bg-red-50 text-red-600"
                        aria-label="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function RecalcularCard({
  servicoId,
  temMateriais,
}: {
  servicoId: string;
  temMateriais: boolean;
}) {
  const [quantidade, setQuantidade] = useState("100");
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const calcular = useCalcularServico(servicoId);
  const aplicar = useAplicarCalculoServico(servicoId);

  async function handleCalcular() {
    const q = Number(quantidade);
    if (!q || q <= 0) {
      alert("Informe uma quantidade de referência válida");
      return;
    }
    try {
      const r = await calcular.mutateAsync(q);
      setResultado(r);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao calcular");
    }
  }

  async function handleAplicar() {
    const q = Number(quantidade);
    if (!q || q <= 0) return;
    try {
      await aplicar.mutateAsync(q);
      alert("Custo padrão e preço padrão atualizados a partir do cálculo.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao aplicar");
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="w-4 h-4 text-brand-red" />
        <h3 className="font-display text-lg font-semibold">Recalcular a partir dos materiais</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Usa o preço médio (ou custo médio, se não houver preço médio) de cada material vinculado
        para gerar o custo e o preço padrão do serviço.
      </p>

      {!temMateriais && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
          Nenhum material vinculado ainda — adicione ao menos um material abaixo antes de calcular.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Quantidade de referência</label>
          <input
            type="number"
            step="0.01"
            className="input-verus w-40"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
        </div>
        <button
          onClick={handleCalcular}
          disabled={calcular.isPending || !temMateriais}
          className="btn-outline"
        >
          {calcular.isPending ? "Calculando..." : "Calcular"}
        </button>
        {resultado && (
          <button onClick={handleAplicar} disabled={aplicar.isPending} className="btn-primary">
            {aplicar.isPending ? "Aplicando..." : "Aplicar ao serviço"}
          </button>
        )}
      </div>

      {resultado && (
        <div className="mt-4 overflow-x-auto">
          <table className="table-verus">
            <tbody>
              {resultado.linhasMateriais.map((l, i) => (
                <tr key={i}>
                  <td>{l.label}</td>
                  <td className="text-right tabular-nums">{formatCurrency(l.valor)}</td>
                </tr>
              ))}
              <tr>
                <td className="font-medium">Subtotal materiais</td>
                <td className="text-right tabular-nums font-medium">
                  {formatCurrency(resultado.materiaisSubtotal)}
                </td>
              </tr>
              <tr>
                <td>{resultado.perdas.label}</td>
                <td className="text-right tabular-nums">{formatCurrency(resultado.perdas.valor)}</td>
              </tr>
              <tr>
                <td>{resultado.maoDeObra.label}</td>
                <td className="text-right tabular-nums">
                  {formatCurrency(resultado.maoDeObra.valor)}
                </td>
              </tr>
              <tr>
                <td>{resultado.equipamentos.label}</td>
                <td className="text-right tabular-nums">
                  {formatCurrency(resultado.equipamentos.valor)}
                </td>
              </tr>
              <tr>
                <td>{resultado.episTransporte.label}</td>
                <td className="text-right tabular-nums">
                  {formatCurrency(resultado.episTransporte.valor)}
                </td>
              </tr>
              <tr>
                <td className="font-medium">Custo direto</td>
                <td className="text-right tabular-nums font-medium">
                  {formatCurrency(resultado.custoDireto)}
                </td>
              </tr>
              <tr>
                <td>{resultado.bdi.label}</td>
                <td className="text-right tabular-nums">{formatCurrency(resultado.bdi.valor)}</td>
              </tr>
              <tr>
                <td>{resultado.impostos.label}</td>
                <td className="text-right tabular-nums">
                  {formatCurrency(resultado.impostos.valor)}
                </td>
              </tr>
              <tr>
                <td>{resultado.lucro.label}</td>
                <td className="text-right tabular-nums">{formatCurrency(resultado.lucro.valor)}</td>
              </tr>
              <tr>
                <td className="font-display font-semibold text-brand-dark">Preço total</td>
                <td className="text-right tabular-nums font-display font-semibold text-brand-dark">
                  {formatCurrency(resultado.precoTotal)}
                </td>
              </tr>
              <tr>
                <td className="text-gray-500">
                  Custo unit. ({quantidade} un.) / Preço unit.
                </td>
                <td className="text-right tabular-nums text-gray-500">
                  {formatCurrency(resultado.custoUnit)} / {formatCurrency(resultado.precoUnit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-gray-900">{value}</div>
    </div>
  );
}
