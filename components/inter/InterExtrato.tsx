"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { CATEGORIAS_CAIXA, CATEGORIA_LABEL } from "@/lib/caixa/validacoes";
import { formatCurrency, formatDate } from "@/lib/utils";

type Mov = {
  id: string;
  data: string;
  tipo: "ENTRADA" | "SAIDA";
  valor: number;
  titulo: string;
  descricao: string | null;
  situacao: "SEM_DONO" | "RECONHECIDO" | "IGNORADO";
  categoria: string | null;
  explicacao: string | null;
};
type Resp = {
  ligado: boolean;
  saldo?: number | null;
  saldoEm?: string | null;
  extratoSyncEm?: string | null;
  ultimoErro?: string | null;
  contagem?: { semDono: number; reconhecidos: number; ignorados: number };
  movimentos?: Mov[];
};

const hora = (d?: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { timeZone: "America/Maceio", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

/** Painel do Banco Inter em Contas e saldos: saldo real, extrato importado e o que falta dizer o que é. */
export function InterExtrato({ onMudou }: { onMudou: () => void }) {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<"SEM_DONO" | "">("SEM_DONO");
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [classificando, setClassificando] = useState<Mov | null>(null);
  const jaBuscou = useRef(false);

  const q = useQuery<Resp>({
    queryKey: ["inter-extrato", filtro],
    queryFn: () => fetch(`/api/contas-financeiras/inter${filtro ? `?situacao=${filtro}` : ""}`).then((r) => r.json()),
  });

  async function buscar() {
    setBuscando(true);
    setAviso("");
    const r = await fetch("/api/contas-financeiras/inter", { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setBuscando(false);
    if (!r.ok) setAviso(j.error ?? "Não consegui falar com o banco.");
    else if (j.extrato?.novos) setAviso(`${j.extrato.novos} movimento(s) novo(s), ${j.extrato.reconhecidos} reconhecido(s) sozinho(s).`);
    qc.invalidateQueries({ queryKey: ["inter-extrato"] });
    onMudou();
  }

  // Ao abrir a tela, busca no banco se a última busca tem mais de 15 minutos.
  useEffect(() => {
    if (jaBuscou.current || !q.data?.ligado) return;
    jaBuscou.current = true;
    const ultima = q.data.extratoSyncEm ? new Date(q.data.extratoSyncEm).getTime() : 0;
    if (Date.now() - ultima > 15 * 60_000) buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data?.ligado]);

  if (!q.data) return null;
  if (!q.data.ligado) {
    return (
      <Card>
        <div className="text-sm text-gray-600">
          Banco Inter desligado. O administrador liga em <a className="underline" href="/dashboard/configuracoes">Configurações → Banco Inter</a>.
        </div>
      </Card>
    );
  }
  const c = q.data.contagem ?? { semDono: 0, reconhecidos: 0, ignorados: 0 };

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div>
          <h3 className="font-display text-lg font-semibold text-brand-dark">Banco Inter · extrato automático</h3>
          <p className="text-xs text-gray-500">
            Saldo no banco <b className="text-gray-800">{q.data.saldo != null ? formatCurrency(q.data.saldo) : "—"}</b> às {hora(q.data.saldoEm)} ·
            {" "}{c.reconhecidos} já ligados · <span className={c.semDono ? "text-amber-600 font-semibold" : ""}>{c.semDono} sem dono</span> (60 dias)
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="input-verus !w-auto" value={filtro} onChange={(e) => setFiltro(e.target.value as "SEM_DONO" | "")}>
            <option value="SEM_DONO">Só sem dono</option>
            <option value="">Todos</option>
          </select>
          <button className="btn-outline" onClick={buscar} disabled={buscando}>
            <RefreshCw className={`w-4 h-4 ${buscando ? "animate-spin" : ""}`} /> {buscando ? "Buscando..." : "Atualizar agora"}
          </button>
        </div>
      </div>
      {(aviso || q.data.ultimoErro) && (
        <div className="px-4 py-2 text-sm bg-amber-50 text-amber-800 border-b border-amber-100">{aviso || `Última busca deu erro: ${q.data.ultimoErro}`}</div>
      )}
      <div className="overflow-x-auto">
        <table className="table-verus">
          <thead>
            <tr><th>Data</th><th>No banco</th><th className="text-right">Valor</th><th>O sistema entendeu</th><th></th></tr>
          </thead>
          <tbody>
            {q.data.movimentos?.map((m) => (
              <tr key={m.id}>
                <td className="whitespace-nowrap">{formatDate(m.data)}</td>
                <td>
                  {m.titulo}
                  {m.descricao && <div className="text-xs text-gray-500">{m.descricao}</div>}
                </td>
                <td className={`text-right whitespace-nowrap ${m.tipo === "ENTRADA" ? "text-green-700" : "text-red-600"}`}>
                  {m.tipo === "ENTRADA" ? "+ " : "- "}{formatCurrency(m.valor)}
                </td>
                <td>
                  {m.situacao === "SEM_DONO" && <Badge tone="yellow">Sem dono</Badge>}
                  {m.situacao === "RECONHECIDO" && (
                    <>
                      <Badge tone="green">{m.categoria ? CATEGORIA_LABEL[m.categoria as keyof typeof CATEGORIA_LABEL] ?? m.categoria : "Ligado"}</Badge>{" "}
                      <span className="text-xs text-gray-600">{m.explicacao}</span>
                    </>
                  )}
                  {m.situacao === "IGNORADO" && (
                    <>
                      <Badge tone="neutral">Não conta</Badge> <span className="text-xs text-gray-600">{m.explicacao}</span>
                    </>
                  )}
                </td>
                <td className="text-right">
                  {m.situacao === "SEM_DONO" && (
                    <button className="btn-outline !py-1 text-sm whitespace-nowrap" onClick={() => setClassificando(m)}>Dizer o que é</button>
                  )}
                </td>
              </tr>
            ))}
            {q.data.movimentos?.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-500 py-6">{filtro ? "Nada sem dono. Tudo ligado." : "Nenhum movimento nos últimos 60 dias."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {classificando && (
        <ClassificarModal
          mov={classificando}
          onClose={() => setClassificando(null)}
          onSalvo={() => {
            setClassificando(null);
            qc.invalidateQueries({ queryKey: ["inter-extrato"] });
            onMudou();
          }}
        />
      )}
    </Card>
  );
}

type Sug = {
  contas: { id: string; descricao: string; quem: string; aberto: number; vencimento: string }[];
  lancamentos: { id: string; data: string; descricao: string; categoria: string; valor: number }[];
};
type Opcao = { id: string; nome: string };

function ClassificarModal({ mov, onClose, onSalvo }: { mov: Mov; onClose: () => void; onSalvo: () => void }) {
  const entrada = mov.tipo === "ENTRADA";
  const [modo, setModo] = useState<"conta" | "lancar" | "ja" | "ignorar">("conta");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [f, setF] = useState({ categoria: entrada ? "RECEBIMENTO" : "MATERIAL", descricao: mov.titulo, socioId: "", obraId: "", favorecido: "", motivo: "" });

  const sug = useQuery<Sug>({ queryKey: ["inter-sug", mov.id], queryFn: () => fetch(`/api/contas-financeiras/inter/${mov.id}`).then((r) => r.json()) });
  const socios = useQuery<Opcao[]>({ queryKey: ["opc-socios"], queryFn: () => fetch("/api/socios").then((r) => r.json()).then((j) => j.socios ?? []) });
  const obras = useQuery<Opcao[]>({ queryKey: ["opc-obras"], queryFn: () => fetch("/api/obras?pageSize=100").then((r) => r.json()).then((j) => j.data ?? []) });

  async function enviar(corpo: Record<string, unknown>) {
    setSalvando(true);
    setErro("");
    const r = await fetch(`/api/contas-financeiras/inter/${mov.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
    const j = await r.json().catch(() => ({}));
    setSalvando(false);
    if (!r.ok) return setErro(j.error ?? "Não salvou");
    onSalvo();
  }

  const abas: [typeof modo, string][] = [
    ["conta", entrada ? "Pagamento de cliente" : "Conta a pagar"],
    ["lancar", "Outro (lançar)"],
    ["ja", "Já lançado"],
    ["ignorar", "Não conta"],
  ];

  return (
    <Modal open onClose={onClose} title={`${entrada ? "Entrou" : "Saiu"} ${formatCurrency(mov.valor)} · ${formatDate(mov.data)}`}>
      <div className="space-y-3 text-sm">
        <p className="text-gray-600">{mov.titulo}{mov.descricao ? ` · ${mov.descricao}` : ""}</p>
        <div className="flex flex-wrap gap-1">
          {abas.map(([k, rot]) => (
            <button key={k} className={modo === k ? "btn-primary !py-1" : "btn-outline !py-1"} onClick={() => { setModo(k); setErro(""); }}>{rot}</button>
          ))}
        </div>

        {modo === "conta" && (
          <div className="space-y-1 max-h-72 overflow-y-auto">
            <p className="text-gray-500">{entrada ? "Contas a receber em aberto" : "Contas a pagar em aberto"}, as de valor mais parecido primeiro. Escolher dá baixa nela.</p>
            {sug.data?.contas.map((c) => (
              <button key={c.id} disabled={salvando} onClick={() => enviar(entrada ? { acao: "RECEBER", contaReceberId: c.id } : { acao: "PAGAR", contaPagarId: c.id })}
                className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 flex justify-between gap-2">
                <span>{c.quem && <b>{c.quem} · </b>}{c.descricao}<span className="text-xs text-gray-500"> · vence {formatDate(c.vencimento)}</span></span>
                <span className={Math.round(c.aberto * 100) === Math.round(mov.valor * 100) ? "text-green-700 font-semibold whitespace-nowrap" : "whitespace-nowrap"}>{formatCurrency(c.aberto)}</span>
              </button>
            ))}
            {sug.data && sug.data.contas.length === 0 && <p className="text-gray-500">Nenhuma conta em aberto.</p>}
          </div>
        )}

        {modo === "lancar" && (
          <div className="space-y-2">
            <label className="block">Categoria
              <select className="input-verus" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
                {CATEGORIAS_CAIXA.map((c) => <option key={c} value={c}>{CATEGORIA_LABEL[c]}</option>)}
              </select>
            </label>
            <label className="block">Descrição<input className="input-verus" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></label>
            <label className="block">Quem recebeu / pagou<input className="input-verus" value={f.favorecido} onChange={(e) => setF({ ...f, favorecido: e.target.value })} /></label>
            {(f.categoria === "RETIRADA_SOCIO" || f.categoria === "APORTE_SOCIO") && (
              <label className="block">Sócio
                <select className="input-verus" value={f.socioId} onChange={(e) => setF({ ...f, socioId: e.target.value })}>
                  <option value="">—</option>
                  {socios.data?.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </label>
            )}
            <label className="block">Obra (se for de uma obra)
              <select className="input-verus" value={f.obraId} onChange={(e) => setF({ ...f, obraId: e.target.value })}>
                <option value="">—</option>
                {obras.data?.map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </label>
            <div className="flex justify-end">
              <button className="btn-primary" disabled={salvando}
                onClick={() => enviar({ acao: "LANCAR", categoria: f.categoria, descricao: f.descricao, favorecido: f.favorecido || null, socioId: f.socioId || null, obraId: f.obraId || null })}>
                Lançar
              </button>
            </div>
          </div>
        )}

        {modo === "ja" && (
          <div className="space-y-1">
            <p className="text-gray-500">Lançamentos feitos à mão com o mesmo valor (7 dias antes ou depois). Escolher só liga, não lança de novo.</p>
            {sug.data?.lancamentos.map((l) => (
              <button key={l.id} disabled={salvando} onClick={() => enviar({ acao: "JA_LANCADO", lancamentoId: l.id })}
                className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
                {formatDate(l.data)} · {l.descricao} · {formatCurrency(l.valor)}
              </button>
            ))}
            {sug.data && sug.data.lancamentos.length === 0 && <p className="text-gray-500">Nenhum lançamento com esse valor.</p>}
          </div>
        )}

        {modo === "ignorar" && (
          <div className="space-y-2">
            <p className="text-gray-500">Para transferência entre contas da própria Verus ou dinheiro que já foi contado de outro jeito.</p>
            <label className="block">Motivo<input className="input-verus" value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} placeholder="Transferência para o PicPay da empresa" /></label>
            <div className="flex justify-end"><button className="btn-primary" disabled={salvando} onClick={() => enviar({ acao: "IGNORAR", motivo: f.motivo })}>Salvar</button></div>
          </div>
        )}

        {erro && <p className="text-red-600">{erro}</p>}
      </div>
    </Modal>
  );
}
