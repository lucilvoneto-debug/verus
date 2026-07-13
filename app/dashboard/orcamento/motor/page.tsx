"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useServicos } from "@/hooks/useServicos";
import { useMotorOrcamento, type MotorOrcamentoResposta } from "@/hooks/useOrcamentos";
import { formatCurrency } from "@/lib/utils";

type Servico = { id: string; nome: string; unidade: string };

const unidadeLabel: Record<string, string> = {
  M2: "m²",
  METRO_LINEAR: "ml",
  DIARIA: "diária",
  UNIDADE: "un",
};

export default function MotorOrcamentoPage() {
  const router = useRouter();
  const { data: servicosResp } = useServicos({ pageSize: 200, ativo: "true" });
  const servicos: Servico[] = servicosResp?.data ?? [];
  const motor = useMotorOrcamento();

  const [elemento, setElemento] = useState("");
  const [quantidade, setQuantidade] = useState("100");
  const [servicoId, setServicoId] = useState("");
  const [resposta, setResposta] = useState<MotorOrcamentoResposta | null>(null);

  async function handleCalcular() {
    const q = Number(quantidade);
    if (!servicoId) return alert("Selecione o sistema (serviço)");
    if (!q || q <= 0) return alert("Informe uma área/quantidade válida");
    try {
      const r = await motor.mutateAsync({ servicoId, quantidade: q });
      setResposta(r);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao calcular");
    }
  }

  function handleGerarOrcamento() {
    if (!resposta) return;
    const { servico, resultado } = resposta;
    const item = {
      servicoId: servico.id,
      descricao: elemento.trim() || servico.nome,
      area: resultado.quantidade,
      quantidade: resultado.quantidade,
      unidade: servico.unidade,
      custoUnit: resultado.custoUnit,
      precoUnit: resultado.precoUnit,
      subtotal: resultado.precoTotal,
    };
    sessionStorage.setItem("motor-orcamento-item", JSON.stringify(item));
    router.push("/dashboard/orcamento/novo");
  }

  const unidade = resposta?.servico.unidade ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orcamento" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">
            Motor de orçamento
          </h2>
          <p className="text-sm text-gray-500">
            Calcule o custo e o preço de um elemento a partir dos materiais reais do sistema
            escolhido.
          </p>
        </div>
      </div>

      <Card>
        <h3 className="font-display text-lg font-semibold mb-4">Elemento a orçar</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Elemento (rótulo)"
            placeholder="Ex.: Laje descoberta"
            value={elemento}
            onChange={(e) => setElemento(e.target.value)}
          />
          <Input
            label="Área/quantidade"
            type="number"
            step="0.01"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Sistema (serviço)</label>
            <select
              className="input-verus"
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {servicos.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({unidadeLabel[s.unidade] ?? s.unidade})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleCalcular} disabled={motor.isPending} className="btn-primary">
            <Calculator className="w-4 h-4" />
            {motor.isPending ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </Card>

      {resposta && (
        <>
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="table-verus">
                <thead>
                  <tr>
                    <th>Composição</th>
                    <th className="text-right pr-5">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {resposta.resultado.linhasMateriais.map((l, i) => (
                    <tr key={i}>
                      <td>{l.label}</td>
                      <td className="text-right pr-5 tabular-nums">{formatCurrency(l.valor)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="font-medium">Subtotal materiais</td>
                    <td className="text-right pr-5 tabular-nums font-medium">
                      {formatCurrency(resposta.resultado.materiaisSubtotal)}
                    </td>
                  </tr>
                  <tr>
                    <td>{resposta.resultado.perdas.label}</td>
                    <td className="text-right pr-5 tabular-nums">
                      {formatCurrency(resposta.resultado.perdas.valor)}
                    </td>
                  </tr>
                  <tr>
                    <td>{resposta.resultado.equipamentos.label}</td>
                    <td className="text-right pr-5 tabular-nums">
                      {formatCurrency(resposta.resultado.equipamentos.valor)}
                    </td>
                  </tr>
                  <tr>
                    <td>{resposta.resultado.maoDeObra.label}</td>
                    <td className="text-right pr-5 tabular-nums">
                      {formatCurrency(resposta.resultado.maoDeObra.valor)}
                    </td>
                  </tr>
                  <tr>
                    <td>{resposta.resultado.episTransporte.label}</td>
                    <td className="text-right pr-5 tabular-nums">
                      {formatCurrency(resposta.resultado.episTransporte.valor)}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Custo direto</td>
                    <td className="text-right pr-5 tabular-nums font-medium">
                      {formatCurrency(resposta.resultado.custoDireto)}
                    </td>
                  </tr>
                  <tr>
                    <td>{resposta.resultado.bdi.label}</td>
                    <td className="text-right pr-5 tabular-nums">
                      {formatCurrency(resposta.resultado.bdi.valor)}
                    </td>
                  </tr>
                  <tr>
                    <td>{resposta.resultado.impostos.label}</td>
                    <td className="text-right pr-5 tabular-nums">
                      {formatCurrency(resposta.resultado.impostos.valor)}
                    </td>
                  </tr>
                  <tr>
                    <td>{resposta.resultado.lucro.label}</td>
                    <td className="text-right pr-5 tabular-nums">
                      {formatCurrency(resposta.resultado.lucro.valor)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="bg-brand-dark text-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-white/60">
                  {elemento.trim() || resposta.servico.nome} ·{" "}
                  {resposta.resultado.quantidade} {unidadeLabel[unidade] ?? unidade}
                </div>
                <div className="font-display text-4xl font-bold tabular-nums">
                  {formatCurrency(resposta.resultado.precoTotal)}
                </div>
                <div className="text-sm text-white/70 tabular-nums">
                  {formatCurrency(resposta.resultado.precoUnit)} / {unidadeLabel[unidade] ?? unidade}{" "}
                  · custo {formatCurrency(resposta.resultado.custoUnit)} /{" "}
                  {unidadeLabel[unidade] ?? unidade}
                </div>
              </div>
              <button onClick={handleGerarOrcamento} className="btn-primary bg-white text-brand-dark hover:bg-white/90">
                Gerar orçamento com este cálculo <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
