"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LancamentoModal } from "@/components/caixa/LancamentoModal";
import { InterExtrato } from "@/components/inter/InterExtrato";
import { CATEGORIA_LABEL, CATEGORIAS_CAIXA } from "@/lib/caixa/validacoes";
import { formatCurrency, formatDate } from "@/lib/utils";

type Conta = { id: string; nome: string; banco: string | null; saldo: number; conferidoEm: string | null; observacoes: string | null };
type Lanc = {
  id: string; data: string; tipo: string; valor: number; descricao: string; categoria: keyof typeof CATEGORIA_LABEL;
  favorecido: string | null; fonte: string | null; incerto: boolean;
  conta: { nome: string } | null; obra: { nome: string } | null; socio: { nome: string } | null;
};

export default function ContasSaldosPage() {
  const qc = useQueryClient();
  const [mes, setMes] = useState("");
  const [contaId, setContaId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [novo, setNovo] = useState(false);
  const [novaConta, setNovaConta] = useState(false);
  const [saldoDe, setSaldoDe] = useState<Conta | null>(null);

  const contas = useQuery<{ contas: Conta[]; total: number }>({
    queryKey: ["contas-financeiras"],
    queryFn: () => fetch("/api/contas-financeiras").then((r) => r.json()),
  });
  const filtro = new URLSearchParams();
  if (mes) {
    const [a, m] = mes.split("-").map(Number);
    filtro.set("inicio", `${mes}-01`);
    filtro.set("fim", new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10));
  }
  if (contaId) filtro.set("contaId", contaId);
  if (categoria) filtro.set("categoria", categoria);
  const extrato = useQuery<{ data: Lanc[]; porCategoria: Record<string, { entrada: number; saida: number }> }>({
    queryKey: ["lancamentos", filtro.toString()],
    queryFn: () => fetch(`/api/lancamentos?${filtro}`).then((r) => r.json()),
  });

  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["lancamentos"] });
    qc.invalidateQueries({ queryKey: ["contas-financeiras"] });
  };
  const saidas = Object.entries(extrato.data?.porCategoria ?? {})
    .map(([c, v]) => ({ c, v: v.saida }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v);
  const maiorSaida = Math.max(1, ...saidas.map((s) => s.v));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Contas e saldos</h2>
          <p className="text-sm text-gray-500">Onde está o dinheiro da Verus e o extrato de tudo que entrou e saiu.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={() => setNovaConta(true)}>Nova conta</button>
          <button className="btn-primary" onClick={() => setNovo(true)}><Plus className="w-4 h-4" /> Lançamento</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {contas.data?.contas.map((c) => (
          <Card key={c.id}>
            <div className="text-xs text-gray-500">{c.nome}</div>
            <div className="font-display text-2xl font-bold mt-1">{formatCurrency(c.saldo)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {c.conferidoEm ? `conferido em ${formatDate(c.conferidoEm)}` : "sem saldo conferido"} ·{" "}
              <button className="underline" onClick={() => setSaldoDe(c)}>conferir saldo</button>
            </div>
          </Card>
        ))}
        <Card className="bg-brand-dark text-white">
          <div className="text-xs text-white/70">Total em caixa</div>
          <div className="font-display text-2xl font-bold mt-1">{formatCurrency(contas.data?.total ?? 0)}</div>
          <div className="text-xs text-white/70 mt-1">soma do último saldo conferido de cada conta (veja a data em cada uma)</div>
        </Card>
      </div>

      <InterExtrato onMudou={recarregar} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border-b border-gray-100">
            <input type="month" className="input-verus" value={mes} onChange={(e) => setMes(e.target.value)} />
            <select className="input-verus" value={contaId} onChange={(e) => setContaId(e.target.value)}>
              <option value="">Todas as contas</option>
              {contas.data?.contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <select className="input-verus" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas as categorias</option>
              {CATEGORIAS_CAIXA.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="table-verus">
              <thead><tr><th>Data</th><th>Descrição</th><th>Obra</th><th>Categoria</th><th>Conta</th><th className="text-right">Valor</th></tr></thead>
              <tbody>
                {extrato.data?.data.map((l) => (
                  <tr key={l.id} title={l.fonte ?? ""}>
                    <td className="whitespace-nowrap">{formatDate(l.data)}</td>
                    <td>
                      {l.descricao}
                      {l.favorecido && <span className="text-gray-500"> · {l.favorecido}</span>}
                      {l.incerto && <Badge tone="yellow" className="ml-2">conferir</Badge>}
                    </td>
                    <td>{l.obra?.nome ?? "—"}</td>
                    <td>{CATEGORIA_LABEL[l.categoria] ?? l.categoria}</td>
                    <td>{l.conta?.nome ?? "—"}</td>
                    <td className={`text-right whitespace-nowrap ${l.tipo === "ENTRADA" ? "text-green-700" : "text-red-600"}`}>
                      {l.tipo === "ENTRADA" ? "+ " : "- "}{formatCurrency(l.valor)}
                    </td>
                  </tr>
                ))}
                {extrato.data && extrato.data.data.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-8">Nenhum lançamento neste filtro.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold text-brand-dark">Para onde foi o dinheiro</h3>
          <p className="text-xs text-gray-500 mb-3">saídas do filtro escolhido</p>
          {saidas.map((s) => (
            <div key={s.c} className="mb-3">
              <div className="flex justify-between text-sm"><span>{CATEGORIA_LABEL[s.c as keyof typeof CATEGORIA_LABEL] ?? s.c}</span><b>{formatCurrency(s.v)}</b></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-1"><div className="h-full bg-brand" style={{ width: `${(100 * s.v) / maiorSaida}%` }} /></div>
            </div>
          ))}
          {saidas.length === 0 && <p className="text-sm text-gray-500">Sem saídas neste filtro.</p>}
        </Card>
      </div>

      {novo && <LancamentoModal open onClose={() => setNovo(false)} onSalvo={recarregar} />}
      {novaConta && <NovaContaModal onClose={() => setNovaConta(false)} onSalvo={recarregar} />}
      {saldoDe && <SaldoModal conta={saldoDe} onClose={() => setSaldoDe(null)} onSalvo={recarregar} />}
    </div>
  );
}

function NovaContaModal({ onClose, onSalvo }: { onClose: () => void; onSalvo: () => void }) {
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [erro, setErro] = useState("");
  async function salvar() {
    if (!nome.trim()) return setErro("Dê um nome para a conta.");
    const r = await fetch("/api/contas-financeiras", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nome, banco }) });
    if (!r.ok) return setErro("Não salvou. Talvez já exista uma conta com esse nome.");
    onSalvo();
    onClose();
  }
  return (
    <Modal open onClose={onClose} title="Nova conta">
      <div className="space-y-3 text-sm">
        <label className="block">Nome<input className="input-verus" value={nome} onChange={(e) => { setNome(e.target.value); setErro(""); }} placeholder="Mercado Pago" /></label>
        <label className="block">Banco<input className="input-verus" value={banco} onChange={(e) => setBanco(e.target.value)} /></label>
        {erro && <p className="text-red-600">{erro}</p>}
        <div className="flex justify-end gap-2"><button className="btn-outline" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={salvar}>Salvar</button></div>
      </div>
    </Modal>
  );
}

function SaldoModal({ conta, onClose, onSalvo }: { conta: Conta; onClose: () => void; onSalvo: () => void }) {
  const [data, setData] = useState(new Date().toLocaleDateString("sv-SE", { timeZone: "America/Maceio" }));
  const [saldo, setSaldo] = useState("");
  const [erro, setErro] = useState("");
  async function salvar() {
    if (saldo === "" || isNaN(Number(saldo))) return setErro("Informe o saldo que aparece no aplicativo do banco.");
    const r = await fetch("/api/contas-financeiras", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contaId: conta.id, data, saldo: Number(saldo) }) });
    if (!r.ok) return setErro("Não salvou. Tente de novo.");
    onSalvo();
    onClose();
  }
  return (
    <Modal open onClose={onClose} title={`Conferir saldo · ${conta.nome}`}>
      <div className="space-y-3 text-sm">
        <p className="text-gray-500">O sistema calcula {formatCurrency(conta.saldo)}. Digite o saldo que o banco mostra; dali para frente ele parte desse número.</p>
        <label className="block">Data<input type="date" className="input-verus" value={data} onChange={(e) => setData(e.target.value)} /></label>
        <label className="block">Saldo no banco (R$)<input type="number" step="0.01" className="input-verus" value={saldo} onChange={(e) => { setSaldo(e.target.value); setErro(""); }} /></label>
        {erro && <p className="text-red-600">{erro}</p>}
        <div className="flex justify-end gap-2"><button className="btn-outline" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={salvar}>Salvar</button></div>
      </div>
    </Modal>
  );
}
