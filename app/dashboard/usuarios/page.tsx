"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { KeyRound, Pencil, Plus, Search, ShieldCheck, UserX, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { MATRIZ, PAPEIS, PAPEL_LABEL, type Papel } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

type Usuario = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  colaborador: { id: string; nome: string; funcao: string } | null;
};

type Form = { name: string; email: string; role: Papel; active: boolean; password: string };

const vazio: Form = { name: "", email: "", role: "COMERCIAL", active: true, password: "" };

function useUsuarios(params: { q: string; role: string; ativo: string }) {
  const sp = new URLSearchParams({ todos: "1" });
  if (params.q) sp.set("q", params.q);
  if (params.role) sp.set("role", params.role);
  if (params.ativo) sp.set("ativo", params.ativo);
  return useQuery<{ data: Usuario[] }>({
    queryKey: ["usuarios-admin", params],
    queryFn: async () => {
      const r = await fetch(`/api/usuarios?${sp}`);
      if (!r.ok) throw new Error("Erro ao carregar usuários");
      return r.json();
    },
  });
}

function toneDoPapel(role: string): "blue" | "green" | "yellow" | "red" | "neutral" {
  if (role === "ADMIN") return "red";
  if (role === "GESTOR") return "yellow";
  if (role === "FINANCEIRO") return "green";
  if (role === "TECNICO") return "neutral";
  return "blue";
}

function ResumoPermissoes({ papel }: { papel: Papel }) {
  const le = Object.entries(MATRIZ).filter(([, r]) => r.ler.includes(papel)).map(([m]) => m);
  const escreve = Object.entries(MATRIZ).filter(([, r]) => r.escrever.includes(papel)).map(([m]) => m);
  return (
    <div className="text-xs text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3 border border-gray-200">
      <p><span className="font-medium text-gray-800">Vê:</span> {le.join(", ")}</p>
      <p><span className="font-medium text-gray-800">Altera:</span> {escreve.length ? escreve.join(", ") : "nada"}</p>
      <p><span className="font-medium text-gray-800">Exclui registros:</span> {papel === "ADMIN" || papel === "GESTOR" ? "sim" : "não (só inativa/cancela)"}</p>
    </div>
  );
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const souAdmin = session?.user?.role === "ADMIN";
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [ativo, setAtivo] = useState("");
  const { data, isLoading } = useUsuarios({ q, role, ativo });

  const [modal, setModal] = useState<null | { modo: "novo" } | { modo: "editar"; u: Usuario } | { modo: "senha"; u: Usuario }>(null);
  const [form, setForm] = useState<Form>(vazio);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!modal) return;
    setErro(null);
    if (modal.modo === "novo") setForm(vazio);
    else setForm({ name: modal.u.name, email: modal.u.email, role: (PAPEIS as readonly string[]).includes(modal.u.role) ? (modal.u.role as Papel) : "COMERCIAL", active: modal.u.active, password: "" });
  }, [modal]);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!modal) return;
      const url = modal.modo === "novo" ? "/api/usuarios" : `/api/usuarios/${modal.u.id}`;
      const method = modal.modo === "novo" ? "POST" : "PUT";
      const body =
        modal.modo === "senha"
          ? { password: form.password }
          : { name: form.name, email: form.email, role: form.role, active: form.active, ...(form.password ? { password: form.password } : {}) };
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha ao salvar");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios-admin"] });
      setModal(null);
    },
    onError: (e) => setErro(e.message),
  });

  const alternar = useMutation({
    mutationFn: async (u: Usuario) => {
      const r = await fetch(`/api/usuarios/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !u.active }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha");
      return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios-admin"] }),
    onError: (e) => alert(e.message),
  });

  const lista = data?.data ?? [];
  const ativos = lista.filter((u) => u.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Usuários</h2>
          <p className="text-sm text-gray-500">Acessos ao ERP e papel de cada pessoa. {ativos} ativo(s).</p>
        </div>
        {souAdmin && (
          <button className="btn-primary" onClick={() => setModal({ modo: "novo" })}>
            <Plus className="w-4 h-4" /> Novo usuário
          </button>
        )}
      </div>

      {!souAdmin && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Somente administradores criam ou alteram usuários.
        </div>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input placeholder="Buscar por nome ou e-mail…" value={q} onChange={(e) => setQ(e.target.value)} className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <select className="input-verus" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Todos os papéis</option>
            {PAPEIS.map((p) => (
              <option key={p} value={p}>{PAPEL_LABEL[p]}</option>
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
                <th>E-mail</th>
                <th>Papel</th>
                <th>Colaborador</th>
                <th>Desde</th>
                <th>Status</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="text-center text-gray-500 py-8">Carregando...</td></tr>}
              {!isLoading && lista.length === 0 && <tr><td colSpan={7} className="text-center text-gray-500 py-8">Nenhum usuário.</td></tr>}
              {lista.map((u) => (
                <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                  <td className="font-medium">
                    {u.name}
                    {session?.user?.id === u.id && <span className="ml-2 text-[10px] uppercase text-gray-400">você</span>}
                  </td>
                  <td className="text-sm">{u.email}</td>
                  <td><Badge tone={toneDoPapel(u.role)}>{PAPEL_LABEL[u.role as Papel] ?? u.role}</Badge></td>
                  <td className="text-sm">{u.colaborador ? `${u.colaborador.nome} · ${u.colaborador.funcao}` : "—"}</td>
                  <td className="text-sm">{formatDate(u.createdAt)}</td>
                  <td><Badge tone={u.active ? "green" : "neutral"}>{u.active ? "Ativo" : "Inativo"}</Badge></td>
                  <td>
                    {souAdmin && (
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <button onClick={() => setModal({ modo: "editar", u })} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setModal({ modo: "senha", u })} className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Redefinir senha">
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {session?.user?.id !== u.id && (
                          <button
                            onClick={() => confirm(`${u.active ? "Desativar" : "Reativar"} ${u.name}?`) && alternar.mutate(u)}
                            className={`p-2 rounded ${u.active ? "hover:bg-red-50 text-red-600" : "hover:bg-green-50 text-green-700"}`}
                            title={u.active ? "Desativar" : "Reativar"}
                          >
                            {u.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.modo === "novo" ? "Novo usuário" : modal?.modo === "senha" ? `Nova senha — ${modal.u.name}` : "Editar usuário"}
      >
        {modal && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              salvar.mutate();
            }}
          >
            {modal.modo !== "senha" && (
              <>
                <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Papel</label>
                  <select className="input-verus" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Papel })}>
                    {PAPEIS.map((p) => (
                      <option key={p} value={p}>{PAPEL_LABEL[p]}</option>
                    ))}
                  </select>
                </div>
                <ResumoPermissoes papel={form.role} />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Ativo
                </label>
              </>
            )}
            <Input
              label={modal.modo === "novo" ? "Senha" : modal.modo === "senha" ? "Nova senha" : "Nova senha (deixe vazio para manter)"}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={modal.modo === "editar" && !form.password ? undefined : 6}
              required={modal.modo !== "editar"}
              autoComplete="new-password"
            />
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
