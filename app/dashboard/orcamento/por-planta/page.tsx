"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileSpreadsheet, Trash2, Plus, Download, Printer, AlertTriangle, Info, FileText, Save, X, Loader2 } from "lucide-react";
import {
  calcularOrcamento,
  TIPOS_LISTA,
  REGRAS,
  type AmbienteEntrada,
  type TipoAmbiente,
} from "@/lib/impermeabilizacao/regras";

type Unidade = "m" | "cm" | "mm";

const fmt = (n: number, d = 2) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

interface OpcaoLista { id: string; nome: string; unidade?: string; precoPadrao?: number; custoPadrao?: number }

export default function OrcamentoPorPlantaPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<string>("");
  const [avisosArquivo, setAvisosArquivo] = useState<string[]>([]);
  const [unidade, setUnidade] = useState<Unidade>("m");
  const [ambientes, setAmbientes] = useState<AmbienteEntrada[]>([]);
  const [preco, setPreco] = useState<number>(0);
  const [ultimoFile, setUltimoFile] = useState<File | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // modal "gerar orçamento formal"
  const [modal, setModal] = useState(false);
  const [clientes, setClientes] = useState<OpcaoLista[]>([]);
  const [servicos, setServicos] = useState<OpcaoLista[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  const resumo = useMemo(() => calcularOrcamento(ambientes), [ambientes]);
  const valorTotal = useMemo(() => resumo.areaTotalGeral * (preco || 0), [resumo, preco]);

  async function baixarPdf() {
    setGerandoPdf(true);
    try {
      const res = await fetch("/api/orcamento/por-planta/memorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arquivo, ambientes, preco }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Falha ao gerar PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `memorial_${(arquivo || "orcamento").replace(/\.[^.]+$/, "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao gerar PDF.");
    } finally {
      setGerandoPdf(false);
    }
  }

  async function abrirModal() {
    setModal(true);
    setErroModal(null);
    try {
      const [rc, rs] = await Promise.all([
        fetch("/api/clientes?pageSize=100").then((r) => r.json()),
        fetch("/api/servicos?ativo=true&pageSize=100").then((r) => r.json()),
      ]);
      setClientes(rc.data ?? []);
      setServicos(rs.data ?? []);
      if (!preco && rs.data?.[0]?.precoPadrao) setPreco(rs.data[0].precoPadrao);
      if (rs.data?.[0]?.id) setServicoId(rs.data[0].id);
    } catch {
      setErroModal("Não consegui carregar clientes/serviços.");
    }
  }

  async function gerarOrcamento() {
    if (!clienteId) return setErroModal("Escolha o cliente.");
    if (!servicoId) return setErroModal("Escolha o serviço.");
    if (!preco || preco <= 0) return setErroModal("Informe o preço por m².");
    setSalvando(true);
    setErroModal(null);
    try {
      const sess = await fetch("/api/auth/session").then((r) => r.json());
      const vendedorId = sess?.user?.id;
      if (!vendedorId) throw new Error("Sessão sem vendedor. Refaça o login.");
      const servico = servicos.find((x) => x.id === servicoId);
      const custoUnit = servico?.custoPadrao ?? 0;

      const itens = resumo.porTipo.map((t) => ({
        servicoId,
        descricao: `Impermeabilização — ${t.label} (${t.qtd} amb.)`,
        area: t.area,
        quantidade: t.area,
        unidade: "m²",
        custoUnit,
        precoUnit: preco,
        subtotal: +(t.area * preco).toFixed(2),
      }));

      const memorial = resumo.ambientes
        .map((a) => `• ${a.nome} [${REGRAS[a.tipo].label}]: piso ${fmt(a.areaPiso)} + rodapé ${fmt(a.areaRodape)} + box ${fmt(a.areaBox)} ×${a.repeticaoUsada} = ${fmt(a.areaTotal)} m²`)
        .join("\n");

      const validade = new Date();
      validade.setDate(validade.getDate() + 15);

      const payload = {
        clienteId,
        vendedorId,
        dataValidade: validade.toISOString(),
        status: "RASCUNHO",
        desconto: 0,
        observacoes: `Quantitativo por planta (${arquivo}). Área total ${fmt(resumo.areaTotalGeral)} m². Base NBR 9575.\n\n${memorial}`,
        itens,
      };

      const res = await fetch("/api/orcamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao gerar orçamento.");
      router.push(`/dashboard/orcamento/${json.id}`);
    } catch (e) {
      setErroModal(e instanceof Error ? e.message : "Erro.");
    } finally {
      setSalvando(false);
    }
  }

  async function enviar(file: File, uni: Unidade) {
    setCarregando(true);
    setErro(null);
    try {
      const fd = new FormData();
      fd.append("arquivo", file);
      if (file.name.toLowerCase().endsWith(".dxf")) fd.append("unidade", uni);
      const res = await fetch("/api/orcamento/por-planta/parse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao ler o arquivo.");
      setArquivo(json.arquivo);
      setDetalhe(json.detalhe);
      setAvisosArquivo(json.avisos || []);
      setAmbientes(json.resumo.ambientes.map(cru));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro.");
      setAmbientes([]);
      setArquivo(null);
    } finally {
      setCarregando(false);
    }
  }

  // volta pro formato de ENTRADA (sem os campos calculados)
  function cru(a: any): AmbienteEntrada {
    return {
      nome: a.nome,
      areaPiso: a.areaPiso,
      perimetro: a.perimetro,
      tipo: a.tipo,
      altura: a.altura,
      boxComprimento: a.boxComprimento || undefined,
      repeticao: a.repeticao || 1,
      origem: a.origem,
    };
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUltimoFile(f);
    enviar(f, unidade);
  }

  function trocarUnidade(u: Unidade) {
    setUnidade(u);
    if (ultimoFile && ultimoFile.name.toLowerCase().endsWith(".dxf")) enviar(ultimoFile, u);
  }

  function editar(i: number, patch: Partial<AmbienteEntrada>) {
    setAmbientes((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function remover(i: number) {
    setAmbientes((prev) => prev.filter((_, idx) => idx !== i));
  }
  function adicionar() {
    setAmbientes((prev) => [
      ...prev,
      { nome: "Novo ambiente", areaPiso: 0, perimetro: 0, tipo: "AREA_MOLHADA", repeticao: 1, origem: "manual" },
    ]);
  }

  function baixarCsv() {
    const linhas = [
      ["Ambiente", "Tipo", "Area piso (m2)", "Perimetro (m)", "Altura (m)", "Box (m)", "Rep", "Rodape (m2)", "Box (m2)", "Area total (m2)", "Avisos"],
      ...resumo.ambientes.map((a) => [
        a.nome, REGRAS[a.tipo].label, fmt(a.areaPiso), fmt(a.perimetro), fmt(a.alturaUsada),
        fmt(a.boxComprimento || 0), a.repeticaoUsada, fmt(a.areaRodape), fmt(a.areaBox),
        fmt(a.areaTotal), a.avisos.join("; "),
      ]),
      [],
      ["TOTAL PISO", "", fmt(resumo.areaPisoTotal)],
      ["TOTAL RODAPE", "", "", "", "", "", "", fmt(resumo.areaRodapeTotal)],
      ["TOTAL BOX", "", "", "", "", "", "", "", fmt(resumo.areaBoxTotal)],
      ["TOTAL GERAL (m2)", "", "", "", "", "", "", "", "", fmt(resumo.areaTotalGeral)],
    ];
    const csv = linhas.map((l) => l.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memorial_${(arquivo || "orcamento").replace(/\.[^.]+$/, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const temDados = ambientes.length > 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orcamento" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Orçamento por planta</h2>
          <p className="text-sm text-gray-500">
            Suba o projeto (DXF) ou a planilha de áreas. O sistema aplica as regras da NBR 9575 e monta o quantitativo detalhado.
          </p>
        </div>
      </div>

      {/* Upload */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={carregando}
            className="flex-1 border-2 border-dashed border-gray-300 hover:border-brand rounded-xl p-6 text-center transition-colors"
          >
            <Upload className="w-6 h-6 mx-auto text-brand mb-2" />
            <div className="font-medium text-gray-800">
              {carregando ? "Lendo arquivo..." : "Clique para enviar o arquivo"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              DXF (planta CAD) · XLSX/CSV/ODS (planilha de áreas) · até 40 MB
            </div>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".dxf,.xlsx,.xls,.csv,.ods"
            className="hidden"
            onChange={onPick}
          />
          <div className="text-xs text-gray-500 md:w-64 space-y-1">
            <p className="flex items-start gap-1"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" /> DWG: salve como <b>DXF</b> no AutoCAD. Ambientes = polilinhas fechadas.</p>
            <p className="flex items-start gap-1"><FileSpreadsheet className="w-3.5 h-3.5 mt-0.5 shrink-0" /> Planilha: colunas <b>ambiente, área, perímetro</b> (opcional: altura, box, tipo, qtd).</p>
          </div>
        </div>

        {arquivo && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="badge-blue">{arquivo}</span>
            <span className="text-gray-500">{detalhe}</span>
            {arquivo.toLowerCase().endsWith(".dxf") && (
              <label className="flex items-center gap-2 text-gray-600">
                Unidade do desenho:
                <select
                  value={unidade}
                  onChange={(e) => trocarUnidade(e.target.value as Unidade)}
                  className="input-verus !w-auto !py-1"
                >
                  <option value="m">metros</option>
                  <option value="cm">centímetros</option>
                  <option value="mm">milímetros</option>
                </select>
              </label>
            )}
          </div>
        )}

        {erro && (
          <div className="mt-4 badge-red !flex items-start gap-2 !rounded-lg !px-3 !py-2 !text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {erro}
          </div>
        )}
        {avisosArquivo.length > 0 && (
          <ul className="mt-3 text-xs text-amber-700 space-y-1">
            {avisosArquivo.map((a, i) => (
              <li key={i} className="flex items-start gap-1"><AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {a}</li>
            ))}
          </ul>
        )}
      </div>

      {temDados && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Kpi cor="#0F5E7E" titulo="Área total" valor={`${fmt(resumo.areaTotalGeral)} m²`} destaque />
            <Kpi cor="#2D7DD2" titulo="Piso" valor={`${fmt(resumo.areaPisoTotal)} m²`} />
            <Kpi cor="#1D9E75" titulo="Rodapé/paredes" valor={`${fmt(resumo.areaRodapeTotal)} m²`} />
            <Kpi cor="#F0A500" titulo="Box de chuveiro" valor={`${fmt(resumo.areaBoxTotal)} m²`} />
            <Kpi cor={resumo.avisos ? "#EF4444" : "#10B981"} titulo="Avisos" valor={String(resumo.avisos)} />
          </div>

          {/* Preço + ações */}
          <div className="card flex flex-wrap items-end gap-4">
            <label className="text-sm">
              <span className="block text-gray-600 mb-1">Preço por m² (R$)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={preco || ""}
                onChange={(e) => setPreco(Number(e.target.value) || 0)}
                placeholder="ex.: 45,00"
                className="input-verus !w-40"
              />
            </label>
            <div className="text-sm">
              <span className="block text-gray-600 mb-1">Valor estimado</span>
              <div className="font-display text-2xl font-bold text-brand">
                {preco > 0 ? `R$ ${fmt(valorTotal)}` : "—"}
              </div>
            </div>
            <div className="flex-1" />
            <button onClick={baixarCsv} className="btn-outline"><Download className="w-4 h-4" /> Memorial (CSV)</button>
            <button onClick={baixarPdf} disabled={gerandoPdf} className="btn-outline">
              {gerandoPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Memorial (PDF)
            </button>
            <button onClick={abrirModal} className="btn-primary"><Save className="w-4 h-4" /> Gerar orçamento</button>
          </div>

          {/* Tabela editável */}
          <div className="card overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Ambientes ({resumo.ambientes.length})</h3>
              <button onClick={adicionar} className="btn-ghost text-sm"><Plus className="w-4 h-4" /> Adicionar</button>
            </div>
            <table className="table-verus min-w-[900px]">
              <thead>
                <tr>
                  <th>Ambiente</th>
                  <th>Tipo</th>
                  <th className="text-right">Piso m²</th>
                  <th className="text-right">Perím. m</th>
                  <th className="text-right">Altura m</th>
                  <th className="text-right">Box m</th>
                  <th className="text-right">Rep</th>
                  <th className="text-right">Total m²</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resumo.ambientes.map((a, i) => {
                  const regra = REGRAS[a.tipo];
                  return (
                    <tr key={i}>
                      <td>
                        <input value={a.nome} onChange={(e) => editar(i, { nome: e.target.value })} className="input-verus !py-1 min-w-[160px]" />
                        {a.origem && <div className="text-[10px] text-gray-400 mt-0.5">{a.origem}</div>}
                        {a.avisos.map((av, k) => (
                          <div key={k} className="text-[10px] text-amber-600 flex items-start gap-0.5 mt-0.5"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{av}</div>
                        ))}
                      </td>
                      <td>
                        <select
                          value={a.tipo}
                          onChange={(e) => editar(i, { tipo: e.target.value as TipoAmbiente })}
                          className="input-verus !py-1 !w-auto"
                          style={{ borderLeft: `3px solid ${regra.cor}` }}
                        >
                          {TIPOS_LISTA.map((t) => (
                            <option key={t.tipo} value={t.tipo}>{t.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-right"><NumIn v={a.areaPiso} on={(v) => editar(i, { areaPiso: v })} /></td>
                      <td className="text-right"><NumIn v={a.perimetro} on={(v) => editar(i, { perimetro: v })} /></td>
                      <td className="text-right">
                        <NumIn
                          v={a.altura ?? a.alturaUsada}
                          placeholder={`auto ${fmt(regra.alturaPadrao)}`}
                          on={(v) => editar(i, { altura: v })}
                        />
                      </td>
                      <td className="text-right">
                        {regra.aceitaBox ? (
                          <NumIn v={a.boxComprimento ?? 0} on={(v) => editar(i, { boxComprimento: v || undefined })} />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="text-right"><NumIn v={a.repeticaoUsada} step={1} on={(v) => editar(i, { repeticao: Math.max(1, Math.round(v)) })} /></td>
                      <td className="text-right font-semibold text-brand-dark">{fmt(a.areaTotal)}</td>
                      <td>
                        <button onClick={() => remover(i)} className="text-gray-400 hover:text-danger p-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-gray-50">
                  <td colSpan={7} className="px-4 py-3 text-right">Área total geral</td>
                  <td className="px-4 py-3 text-right text-brand-dark">{fmt(resumo.areaTotalGeral)} m²</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Resumo por tipo */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-3">Resumo por sistema</h3>
            <table className="table-verus">
              <thead>
                <tr><th>Sistema / tipo de ambiente</th><th className="text-right">Ambientes</th><th className="text-right">Área (m²)</th><th className="text-right">%</th></tr>
              </thead>
              <tbody>
                {resumo.porTipo.map((t) => (
                  <tr key={t.tipo}>
                    <td><span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: REGRAS[t.tipo].cor }} />{t.label}</td>
                    <td className="text-right">{t.qtd}</td>
                    <td className="text-right font-medium">{fmt(t.area)}</td>
                    <td className="text-right text-gray-500">{resumo.areaTotalGeral > 0 ? fmt((t.area / resumo.areaTotalGeral) * 100, 1) : "0"}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-3">
              Regra aplicada: <b>Área total = piso + (perímetro × altura de subida) + box (1,50 m)</b>. Alturas por função conforme ABNT NBR 9575/9574.
            </p>
          </div>
        </>
      )}

      {/* Modal gerar orçamento formal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !salvando && setModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-brand-dark">Gerar orçamento no sistema</h3>
              <button onClick={() => !salvando && setModal(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-gray-600">Cliente</span>
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="input-verus mt-1">
                  <option value="">Selecione...</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-gray-600">Serviço</span>
                <select value={servicoId} onChange={(e) => setServicoId(e.target.value)} className="input-verus mt-1">
                  <option value="">Selecione...</option>
                  {servicos.map((sv) => <option key={sv.id} value={sv.id}>{sv.nome}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-gray-600">Preço por m² (R$)</span>
                <input type="number" min={0} step="0.01" value={preco || ""} onChange={(e) => setPreco(Number(e.target.value) || 0)} className="input-verus mt-1" />
              </label>
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                <div>Área total: <b>{fmt(resumo.areaTotalGeral)} m²</b> · {resumo.porTipo.length} sistema(s)</div>
                <div>Valor: <b>{preco > 0 ? `R$ ${fmt(valorTotal)}` : "—"}</b> · validade 15 dias · status Rascunho</div>
              </div>
              {erroModal && <div className="badge-red !flex items-start gap-2 !rounded-lg !px-3 !py-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />{erroModal}</div>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModal(false)} disabled={salvando} className="btn-outline">Cancelar</button>
              <button onClick={gerarOrcamento} disabled={salvando} className="btn-primary">
                {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Gerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ titulo, valor, cor, destaque }: { titulo: string; valor: string; cor: string; destaque?: boolean }) {
  return (
    <div className="kpi" style={{ borderTopColor: cor }}>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{titulo}</div>
      <div className={`font-display font-bold ${destaque ? "text-2xl" : "text-xl"} text-brand-dark mt-1`}>{valor}</div>
    </div>
  );
}

function NumIn({ v, on, step = 0.01, placeholder }: { v: number; on: (v: number) => void; step?: number; placeholder?: string }) {
  return (
    <input
      type="number"
      step={step}
      min={0}
      value={Number.isFinite(v) && v !== 0 ? v : ""}
      placeholder={placeholder}
      onChange={(e) => on(Number(e.target.value) || 0)}
      className="input-verus !py-1 !w-24 text-right"
    />
  );
}
