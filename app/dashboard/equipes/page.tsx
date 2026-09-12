"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HardHat, Pencil, Plus, Search, UserX, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { FUNCOES_COLABORADOR, type ColaboradorInput } from "@/lib/validations/colaborador";
import { formatCPF, formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { obraStatusLabel, obraStatusTone } from "@/lib/status";

type Alocacao = {
  id: string;
  papel: string;
  dataInicio: string;
  dataFim: string | null;
  obra: { id: string; numero: string; nome: string; status: string };
};

type Colaborador = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  funcao: string;
  custoHora: number;
  custoDia: number;
  disponivel: boolean;
  ativo: boolean;
  observacoes: string | null;
  userId: string | null;
  user: { id: string; name: string; email: string; role: string; active: boolean } | null;
  alocacoes: Alocacao[];
  _count: { pontos: number; alocacoes: number };
};

type Form = Omit<ColaboradorInput, "custoHora" | "custoDia"> & { custoHora: string; custoDia: string };

const vazio: Form = {
  nome: "",
  cpf: "",
  telefone: "",
  funcao: "APLICADOR",
  custoHora: "0",
  custoDia: "0",
  disponivel: true,
  ativo: true,
  observacoes: "",
  userId: "",
};

const FUNCAO_LABEL: Record<string, string> = {
  APLICADOR: "Aplicador",
  AJUDANTE: "Ajudante",
  TECNICO: "Técnico",
  ENGENHEIRO: "Engenheiro",
  SUPERVISOR: "Supervisor",
  VENDEDOR: "Vendedor",
  ADMINISTRATIVO: "Administrativo",
  MOTORISTA: "Motorista",
};

function useColaboradoresAdmin(p: { q: string; funcao: string; ativo: string }) {
  const sp = new URLSearchParams({ todos: "1" });
  if (p.q) sp.set("q", p.q);
  if (p.funcao) sp.set("funcoes", p.funcao);
  if (p.ativo) sp.set("ativo", p.ativo);
  return useQuery<{ data: Colaborador[] }>({
    queryKey: ["colaboradores-admin", p],
    queryFn: async () => {
      const r = await fetch(`/api/colaboradores?${sp}`);
      if (!r.ok) throw new Error("Erro ao carregar equipe");
      return r.json();
    },
  });
}

function useUsuariosSelect() {
  return useQuery<{ id: string; name: string; email: string; role: string }[]>({
    queryKey: ["usuarios"],
    queryFn: () => fetch("/api/usuarios").then((r) => r.json()),
  });
}

export default function EquipesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [funcao, setFuncao] = useState("");
  const [ativo, setAtivo] = useState("true");
  const [aba, setAba] = useState<"pessoas" | "alocacoes">("pessoas");
  const { data, isLoading } = useColaboradoresAdmin({ q, funcao, ativo });
  const usuarios = useUsuariosSelect();

  const [modal, setModal] = useState<null | { modo: "novo" } | { modo: "editar"; c: Colaborador }>(null);
  const [form, setForm] = useState<Form>(vazio);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!modal) return;
    setErro(null);
    if (modal.modo === "novo") setForm(vazio);
    else {
      const c = modal.c;
      setForm({
        nome: c.nome,
        cpf: c.cpf,
        telefone: c.telefone ?? "",
        funcao: c.funcao,
        custoHora: String(c.custoHora),
        custoDia: String(c.custoDia),
        disponivel: c.disponivel,
        ativo: c.ativo,
        observacoes: c.observacoes ?? "",
        userId: c.userId ?? "",
      });
    }
  }, [modal]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!modal) return;
      const url = modal.modo === "novo" ? "/api/colaboradores" : `/api/colaboradores/${modal.c.id}`;
      const r = await fetch(url, {
        method: modal.modo === "novo" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, custoHora: Number(form.custoHora || 0), custoDia: Number(form.custoDia || 0), userId: form.userId || null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha ao salvar");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colaboradores-admin"] });
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
      setModal(null);
    },
    onError: (e) => setErro(e.message),
  });

  const alternar = useMutation({
    mutationFn: async (c: Colaborador) => {
      const r = await fetch(`/api/colaboradores/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !c.ativo, disponivel: !c.ativo }),
      });
      if (!r.ok) throw new Error("Falha");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["colaboradores-admin"] });
      qc.invalidateQueries({ queryKey: ["colaboradores"] });
    },
  });

  const lista = data?.data ?? [];
  const alocados = lista.filter((c) => c.alocacoes.length > 0);
  const livres = lista.filter((c) => c.ativo && c.disponivel && c.alocacoes.length === 0);
  const custoDiaEquipe = lista.filter((c) => c.ativo).reduce((acc, c) => acc + (c.custoDia || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Equipes</h2>
          <p className="text-sm text-gray-500">Colaboradores, alocação por obra e disponibilidade.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal({ modo: "novo" })}>
          <Plus className="w-4 h-4" /> Novo colaborador
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><p className="text-xs text-gray-500">Ativos</p><p className="font-display text-2xl font-bold text-brand-dark">{lista.filter((c) => c.ativo).length}</p></Card>
        <Card><p className="text-xs text-gray-500">Em obra hoje</p><p className="font-display text-2xl font-bold text-brand">{alocados.length}</p></Card>
        <Card><p className="text-xs text-gray-500">Disponíveis</p><p className="font-display text-2xl font-bold text-success">{livres.length}</p></Card>
        <Card><p className="text-xs text-gray-500">Custo/dia da equipe</p><p className="font-display text-2xl font-bold text-brand-dark">{formatCurrency(custoDiaEquipe)}</p></Card>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(["pessoas", "alocacoes"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setAba(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${aba === k ? "border-brand text-brand" : "border-transparent text-gray-500 hover:text-gray-800"}`}
          >
            {k === "pessoas" ? "Pessoas" : "Quem está em qual obra"}
          </button>
        ))}
      </div>

      {aba === "pessoas" && (
        <>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
                <Search className="w-4 h-4 text-gray-400" />
                <input placeholder="Buscar por nome ou CPF…" value={q} onChange={(e) => setQ(e.target.value)} className="bg-transparent outline-none text-sm flex-1" />
              </div>
              <select className="input-verus" value={funcao} onChange={(e) => setFuncao(e.target.value)}>
                <option value="">Todas as funções</option>
                {FUNCOES_COLABORADOR.map((f) => (
                  <option key={f} value={f}>{FUNCAO_LABEL[f] ?? f}</option>
                ))}
              </select>
              <select className="input-verus" value={ativo} onChange={(e) => setAtivo(e.target.value)}>
                <option value="">Ativos e inativos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
          </Card>

          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="table-verus">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Função</th>
                    <th>Telefone</th>
                    <th>Custo dia</th>
                    <th>Login</th>
                    <th>Hoje</th>
                    <th>Status</th>
                    <th className="text-right pr-5">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && <tr><td colSpan={8} className="text-center text-gray-500 py-8">Carregando...</td></tr>}
                  {!isLoading && lista.length === 0 && <tr><td colSpan={8} className="text-center text-gray-500 py-8">Nenhum colaborador.</td></tr>}
                  {lista.map((c) => (
                    <tr key={c.id} className={c.ativo ? "" : "opacity-60"}>
                      <td>
                        <div className="font-medium">{c.nome}</div>
                        <div className="text-xs text-gray-500 tabular-nums">{formatCPF(c.cpf)}</div>
                      </td>
                      <td><Badge tone="blue">{FUNCAO_LABEL[c.funcao] ?? c.funcao}</Badge></td>
                      <td className="text-sm">{c.telefone ? formatPhone(c.telefone) : "—"}</td>
                      <td className="text-sm tabular-nums">{formatCurrency(c.custoDia)}<span className="text-xs text-gray-400"> · {formatCurrency(c.custoHora)}/h</span></td>
                      <td className="text-sm">{c.user ? <span title={c.user.email}>{c.user.name}</span> : <span className="text-gray-400">sem login</span>}</td>
                      <td className="text-sm">
                        {c.alocacoes.length === 0 ? (
                          <span className={c.disponivel ? "text-success" : "text-gray-400"}>{c.disponivel ? "disponível" : "indisponível"}</span>
                        ) : (
                          <div className="space-y-0.5">
                            {c.alocacoes.map((a) => (
                              <Link key={a.id} href={`/dashboard/obras/${a.obra.id}`} className="block text-brand hover:underline truncate max-w-[14rem]">
                                {a.obra.numero} · {a.obra.nome}
                              </Link>
                            ))}
                          </div>
                        )}
                      </td>
                      <td><Badge tone={c.ativo ? "green" : "neutral"}>{c.ativo ? "Ativo" : "Inativo"}</Badge></td>
                      <td>
                        <div className="flex items-center justify-end gap-1 pr-2">
                          <button onClick={() => setModal({ modo: "editar", c })} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Editar">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirm(`${c.ativo ? "Inativar" : "Reativar"} ${c.nome}?`) && alternar.mutate(c)}
                            className={`p-2 rounded ${c.ativo ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-700"}`}
                            title={c.ativo ? "Inativar" : "Reativar"}
                          >
                            {c.ativo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {aba === "alocacoes" && (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="table-verus">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Colaborador</th>
                  <th>Papel na obra</th>
                  <th>Início</th>
                  <th>Fim</th>
                </tr>
              </thead>
              <tbody>
                {alocados.length === 0 && <tr><td colSpan={5} className="text-center text-gray-500 py-8">Ninguém alocado hoje. Aloque pela aba Equipe de cada obra.</td></tr>}
                {alocados
                  .flatMap((c) => c.alocacoes.map((a) => ({ c, a })))
                  .sort((x, y) => x.a.obra.numero.localeCompare(y.a.obra.numero))
                  .map(({ c, a }) => (
                    <tr key={a.id}>
                      <td>
                        <Link href={`/dashboard/obras/${a.obra.id}`} className="text-brand hover:underline font-medium">{a.obra.numero} · {a.obra.nome}</Link>
                        <div className="mt-0.5"><Badge tone={obraStatusTone(a.obra.status)}>{obraStatusLabel(a.obra.status)}</Badge></div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2"><HardHat className="w-4 h-4 text-gray-400" />{c.nome}</div>
                        <div className="text-xs text-gray-500">{FUNCAO_LABEL[c.funcao] ?? c.funcao}</div>
                      </td>
                      <td className="text-sm">{a.papel}</td>
                      <td className="text-sm">{formatDate(a.dataInicio)}</td>
                      <td className="text-sm">{a.dataFim ? formatDate(a.dataFim) : <span className="text-gray-400">em aberto</span>}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.modo === "novo" ? "Novo colaborador" : "Editar colaborador"}>
        {modal && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              salvar.mutate();
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              <Input label="CPF" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} required />
              <Input label="Telefone" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Função</label>
                <select className="input-verus" value={form.funcao} onChange={(e) => setForm({ ...form, funcao: e.target.value })}>
                  {FUNCOES_COLABORADOR.map((f) => (
                    <option key={f} value={f}>{FUNCAO_LABEL[f] ?? f}</option>
                  ))}
                </select>
              </div>
              <Input label="Custo/hora (R$)" type="number" step="0.01" min={0} value={form.custoHora} onChange={(e) => setForm({ ...form, custoHora: e.target.value })} />
              <Input label="Custo/dia (R$)" type="number" step="0.01" min={0} value={form.custoDia} onChange={(e) => setForm({ ...form, custoDia: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Login no ERP (opcional)</label>
              <select className="input-verus" value={form.userId ?? ""} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
                <option value="">Sem login</option>
                {(usuarios.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} · {u.email}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Técnico/vendedor precisa de login para aparecer nos selects de visita e orçamento.</p>
            </div>
            <textarea className="input-verus" rows={2} placeholder="Observações…" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.disponivel} onChange={(e) => setForm({ ...form, disponivel: e.target.checked })} /> Disponível</label>
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} /> Ativo</label>
            </div>
            {erro && <p className="text-xs text-danger">{erro}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={salvar.isPending}>{salvar.isPending ? "Salvando…" : "Salvar"}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
