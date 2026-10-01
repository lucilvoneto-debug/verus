"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";

type Conteudo = { id: string; titulo: string; tipo: string; canal: string | null; data: string; status: string; responsavel: string | null; obra: { nome: string } | null };
type Campanha = { id: string; nome: string; canal: string; inicio: string; fim: string | null; verba: number | null; gasto: number | null; resultado: string | null };
type Tarefa = { id: string; descricao: string; responsavel: string | null; prazo: string | null; status: string };
type Resp = { mes: string; conteudos: Conteudo[]; campanhas: Campanha[]; tarefas: Tarefa[]; resumo: { planejadas: number; publicadas: number; gravacoes: number; verbaMes: number } };

const corTipo: Record<string, string> = { GRAVACAO: "bg-amber-50", REELS: "bg-sky-50", VIDEO: "bg-sky-50", POST: "bg-emerald-50", STORY: "bg-violet-50", OUTRO: "bg-gray-50" };
const FUSO = "America/Maceio";

export default function MarketingPage() {
  const qc = useQueryClient();
  const [mes, setMes] = useState(new Date().toLocaleDateString("sv-SE", { timeZone: FUSO }).slice(0, 7));
  const [novo, setNovo] = useState<"conteudo" | "campanha" | "tarefa" | null>(null);
  const { data } = useQuery<Resp>({ queryKey: ["marketing", mes], queryFn: () => fetch(`/api/marketing?mes=${mes}`).then((r) => r.json()) });
  const recarregar = () => qc.invalidateQueries({ queryKey: ["marketing"] });

  async function status(qual: "conteudo" | "tarefa", id: string, s: string) {
    await fetch("/api/marketing", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ qual, id, status: s }) });
    recarregar();
  }

  // Calendário do mês: semanas de segunda a domingo.
  const [a, m] = mes.split("-").map(Number);
  const diasNoMes = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const desloc = (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7;
  const celulas = Array.from({ length: Math.ceil((desloc + diasNoMes) / 7) * 7 }, (_, i) => i - desloc + 1);
  const doDia = (d: number) =>
    (data?.conteudos ?? []).filter((c) => new Date(c.data).toLocaleDateString("sv-SE", { timeZone: FUSO }) === `${mes}-${String(d).padStart(2, "0")}`);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Marketing</h2>
          <p className="text-sm text-gray-500">Conteúdo, gravações nas obras, campanhas e quem cuida de cada coisa.</p>
        </div>
        <div className="flex gap-2">
          <input type="month" className="input-verus" value={mes} onChange={(e) => setMes(e.target.value)} />
          <button className="btn-outline" onClick={() => setNovo("tarefa")}>Tarefa</button>
          <button className="btn-outline" onClick={() => setNovo("campanha")}>Campanha</button>
          <button className="btn-primary" onClick={() => setNovo("conteudo")}><Plus className="w-4 h-4" /> Postagem</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><div className="text-xs text-gray-500">Postagens no mês</div><div className="font-display text-2xl font-bold">{data?.resumo.publicadas ?? 0} <span className="text-sm font-normal text-gray-500">de {data?.resumo.planejadas ?? 0} planejadas</span></div></Card>
        <Card><div className="text-xs text-gray-500">Gravações em obra</div><div className="font-display text-2xl font-bold">{data?.resumo.gravacoes ?? 0}</div></Card>
        <Card><div className="text-xs text-gray-500">Verba de anúncio no mês</div><div className="font-display text-2xl font-bold">{formatCurrency(data?.resumo.verbaMes ?? 0)}</div></Card>
        <Card><div className="text-xs text-gray-500">Tarefas abertas</div><div className="font-display text-2xl font-bold">{data?.tarefas.filter((t) => t.status === "ABERTA").length ?? 0}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="font-display text-lg font-semibold text-brand-dark mb-3">Calendário de conteúdo</h3>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((d) => <div key={d} className="text-gray-500 px-1">{d}</div>)}
            {celulas.map((d, i) => (
              <div key={i} className={`border rounded-md min-h-[84px] p-1 ${d < 1 || d > diasNoMes ? "bg-gray-50 border-transparent" : "border-gray-100"}`}>
                {d >= 1 && d <= diasNoMes && (
                  <>
                    <div className="text-gray-500">{d}</div>
                    {doDia(d).map((c) => (
                      <button
                        key={c.id}
                        title={`${c.tipo}${c.responsavel ? " · " + c.responsavel : ""} · clique para marcar publicado`}
                        onClick={() => status("conteudo", c.id, c.status === "PUBLICADO" ? "PLANEJADO" : "PUBLICADO")}
                        className={`block w-full text-left mt-1 px-1 py-0.5 rounded ${corTipo[c.tipo] ?? "bg-gray-50"} ${c.status === "PUBLICADO" ? "line-through text-gray-500" : ""}`}
                      >
                        {c.titulo}
                      </button>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="font-display text-lg font-semibold text-brand-dark mb-2">Tarefas combinadas</h3>
            {data?.tarefas.map((t) => (
              <label key={t.id} className="flex items-start gap-2 py-1.5 border-b border-gray-100 text-sm">
                <input type="checkbox" checked={t.status === "FEITA"} onChange={() => status("tarefa", t.id, t.status === "FEITA" ? "ABERTA" : "FEITA")} className="mt-1" />
                <span className={t.status === "FEITA" ? "line-through text-gray-500" : ""}>
                  {t.descricao}
                  <span className="block text-xs text-gray-500">
                    {t.responsavel ?? "sem responsável"}
                    {t.prazo ? ` · até ${formatDate(t.prazo)}` : ""}
                    {t.status === "ABERTA" && t.prazo && new Date(t.prazo) < new Date() ? " · " : ""}
                    {t.status === "ABERTA" && t.prazo && new Date(t.prazo) < new Date() && <Badge tone="red">atrasada</Badge>}
                  </span>
                </span>
              </label>
            ))}
            {data && data.tarefas.length === 0 && <p className="text-sm text-gray-500">Nenhuma tarefa.</p>}
          </Card>
          <Card>
            <h3 className="font-display text-lg font-semibold text-brand-dark mb-2">Campanhas</h3>
            {data?.campanhas.map((c) => (
              <div key={c.id} className="py-1.5 border-b border-gray-100 text-sm">
                <div className="flex justify-between"><b>{c.nome}</b><span>{c.verba != null ? formatCurrency(c.verba) : "—"}</span></div>
                <div className="text-xs text-gray-500">{c.canal} · {formatDate(c.inicio)}{c.fim ? ` a ${formatDate(c.fim)}` : ""}{c.resultado ? ` · ${c.resultado}` : ""}</div>
              </div>
            ))}
            {data && data.campanhas.length === 0 && <p className="text-sm text-gray-500">Nenhuma campanha.</p>}
          </Card>
        </div>
      </div>

      {novo && <NovoModal qual={novo} onClose={() => setNovo(null)} onSalvo={recarregar} />}
    </div>
  );
}

function NovoModal({ qual, onClose, onSalvo }: { qual: "conteudo" | "campanha" | "tarefa"; onClose: () => void; onSalvo: () => void }) {
  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: FUSO });
  const [f, setF] = useState<Record<string, string>>(
    qual === "conteudo" ? { tipo: "POST", data: hoje, canal: "Instagram" } : qual === "campanha" ? { canal: "Instagram", inicio: hoje } : {}
  );
  const [erro, setErro] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setF((v) => ({ ...v, [k]: e.target.value })); setErro(""); };
  const obrig = qual === "conteudo" ? "titulo" : qual === "campanha" ? "nome" : "descricao";

  async function salvar() {
    if (!f[obrig]?.trim()) return setErro("Preencha o primeiro campo.");
    const r = await fetch("/api/marketing", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ qual, ...f }) });
    if (!r.ok) return setErro("Não salvou. Confira os campos.");
    onSalvo();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={qual === "conteudo" ? "Nova postagem" : qual === "campanha" ? "Nova campanha" : "Nova tarefa"}>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {qual === "conteudo" && (
          <>
            <label className="col-span-2">Título<input className="input-verus" value={f.titulo ?? ""} onChange={set("titulo")} /></label>
            <label>Tipo<select className="input-verus" value={f.tipo} onChange={set("tipo")}>{["POST", "REELS", "STORY", "VIDEO", "GRAVACAO", "OUTRO"].map((t) => <option key={t} value={t}>{t === "GRAVACAO" ? "Gravação em obra" : t.charAt(0) + t.slice(1).toLowerCase()}</option>)}</select></label>
            <label>Data<input type="date" className="input-verus" value={f.data} onChange={set("data")} /></label>
            <label>Canal<input className="input-verus" value={f.canal ?? ""} onChange={set("canal")} /></label>
            <label>Responsável<input className="input-verus" value={f.responsavel ?? ""} onChange={set("responsavel")} /></label>
          </>
        )}
        {qual === "campanha" && (
          <>
            <label className="col-span-2">Nome<input className="input-verus" value={f.nome ?? ""} onChange={set("nome")} /></label>
            <label>Canal<input className="input-verus" value={f.canal ?? ""} onChange={set("canal")} /></label>
            <label>Verba (R$)<input type="number" step="0.01" className="input-verus" value={f.verba ?? ""} onChange={set("verba")} /></label>
            <label>Início<input type="date" className="input-verus" value={f.inicio} onChange={set("inicio")} /></label>
            <label>Fim<input type="date" className="input-verus" value={f.fim ?? ""} onChange={set("fim")} /></label>
          </>
        )}
        {qual === "tarefa" && (
          <>
            <label className="col-span-2">O que fazer<input className="input-verus" value={f.descricao ?? ""} onChange={set("descricao")} /></label>
            <label>Responsável<input className="input-verus" value={f.responsavel ?? ""} onChange={set("responsavel")} /></label>
            <label>Prazo<input type="date" className="input-verus" value={f.prazo ?? ""} onChange={set("prazo")} /></label>
          </>
        )}
      </div>
      {erro && <p className="text-sm text-red-600 mt-2">{erro}</p>}
      <div className="flex justify-end gap-2 mt-4"><button className="btn-outline" onClick={onClose}>Cancelar</button><button className="btn-primary" onClick={salvar}>Salvar</button></div>
    </Modal>
  );
}
