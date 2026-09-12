"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Paperclip, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import {
  IconeTipo,
  tamanhoLegivel,
  useAnexos,
  useEnviarAnexo,
  useExcluirAnexo,
  type AnexoItem,
} from "@/components/documentos/AnexosPanel";
import { ENTIDADES_ANEXO } from "@/lib/anexos";
import { formatDateTime } from "@/lib/utils";

type Opcao = { id: string; label: string };

/** Carrega opções de vínculo conforme a entidade escolhida no modal. */
function useOpcoesEntidade(entidade: string, q: string) {
  return useQuery<Opcao[]>({
    queryKey: ["anexo-opcoes", entidade, q],
    enabled: !!entidade && entidade !== "Geral",
    queryFn: async () => {
      const qs = q.trim();
      if (entidade === "Cliente") {
        const r = await fetch(`/api/clientes?q=${encodeURIComponent(qs)}&pageSize=50`).then((x) => x.json());
        return (r.data ?? []).map((c: { id: string; nome: string }) => ({ id: c.id, label: c.nome }));
      }
      if (entidade === "Obra") {
        const r = await fetch(`/api/obras?q=${encodeURIComponent(qs)}&pageSize=50`).then((x) => x.json());
        return (r.data ?? []).map((o: { id: string; numero: string; nome: string }) => ({ id: o.id, label: `${o.numero} · ${o.nome}` }));
      }
      if (entidade === "Contrato") {
        const r = await fetch(`/api/contratos?q=${encodeURIComponent(qs)}&pageSize=50`).then((x) => x.json());
        return (r.data ?? []).map((c: { id: string; numero: string; cliente?: { nome: string } }) => ({ id: c.id, label: `${c.numero}${c.cliente ? " · " + c.cliente.nome : ""}` }));
      }
      if (entidade === "Orcamento") {
        const r = await fetch(`/api/orcamento?q=${encodeURIComponent(qs)}&pageSize=50`).then((x) => x.json());
        return (r.data ?? []).map((o: { id: string; numero: string; cliente?: { nome: string } }) => ({ id: o.id, label: `${o.numero}${o.cliente ? " · " + o.cliente.nome : ""}` }));
      }
      if (entidade === "Fornecedor") {
        const r = await fetch(`/api/fornecedores?q=${encodeURIComponent(qs)}&pageSize=50`).then((x) => x.json());
        return (r.data ?? []).map((f: { id: string; nome: string }) => ({ id: f.id, label: f.nome }));
      }
      if (entidade === "Visita") {
        const r = await fetch(`/api/visita?pageSize=50`).then((x) => x.json());
        return (r.data ?? []).map((v: { id: string; endereco: string; cliente?: { nome: string } }) => ({ id: v.id, label: `${v.cliente?.nome ?? ""} · ${v.endereco}` }));
      }
      if (entidade === "Lead") {
        const r = await fetch(`/api/leads?q=${encodeURIComponent(qs)}&pageSize=50`).then((x) => x.json());
        return (r.data ?? []).map((l: { id: string; nome: string | null; telefone: string | null }) => ({ id: l.id, label: l.nome ?? l.telefone ?? l.id }));
      }
      return [];
    },
  });
}

function linkEntidade(a: AnexoItem): string | null {
  const def = ENTIDADES_ANEXO.find((e) => e.chave === a.entidade);
  if (!def || !def.rota || a.entidadeId === "-") return null;
  return `${def.rota}/${a.entidadeId}`;
}

function ModalUpload({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entidade, setEntidade] = useState<string>("Geral");
  const [busca, setBusca] = useState("");
  const [entidadeId, setEntidadeId] = useState("");
  const [nome, setNome] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const enviar = useEnviarAnexo();
  const opcoes = useOpcoesEntidade(entidade, busca);

  useEffect(() => {
    setEntidadeId("");
    setBusca("");
  }, [entidade]);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setNome("");
      setErro(null);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setErro("Escolha um arquivo.");
    if (entidade !== "Geral" && !entidadeId) return setErro("Escolha a que registro o documento pertence.");
    setErro(null);
    try {
      await enviar.mutateAsync({ file, entidade, entidadeId: entidade === "Geral" ? undefined : entidadeId, nome: nome || undefined });
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao anexar");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo documento">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
          <input
            type="file"
            className="block w-full text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !nome) setNome(f.name);
            }}
          />
          <p className="text-xs text-gray-500 mt-1">PDF, foto, planilha, DWG/DXF — até 15 MB.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome exibido</label>
          <input className="input-verus" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: ART obra 12, Contrato assinado…" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a</label>
            <select className="input-verus" value={entidade} onChange={(e) => setEntidade(e.target.value)}>
              {ENTIDADES_ANEXO.map((e) => (
                <option key={e.chave} value={e.chave}>{e.label}</option>
              ))}
            </select>
          </div>
          {entidade !== "Geral" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registro</label>
              <input className="input-verus mb-1" placeholder="buscar…" value={busca} onChange={(e) => setBusca(e.target.value)} />
              <select className="input-verus" value={entidadeId} onChange={(e) => setEntidadeId(e.target.value)} size={5}>
                {opcoes.isLoading && <option disabled>Carregando…</option>}
                {(opcoes.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {erro && <p className="text-xs text-danger">{erro}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={enviar.isPending}>
            {enviar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
            {enviar.isPending ? "Enviando…" : "Anexar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function DocumentosPage() {
  const [q, setQ] = useState("");
  const [entidade, setEntidade] = useState("");
  const [tipo, setTipo] = useState("");
  const [modal, setModal] = useState(false);
  const { data, isLoading } = useAnexos({ q, entidade, tipo, pageSize: 200 });
  const excluir = useExcluirAnexo();

  const itens = data?.data ?? [];
  const totalBytes = itens.reduce((acc, a) => acc + (a.tamanho || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Documentos</h2>
          <p className="text-sm text-gray-500">Repositório de anexos por cliente, obra, contrato e orçamento.</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Paperclip className="w-4 h-4" /> Novo documento
        </button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input placeholder="Buscar por nome…" value={q} onChange={(e) => setQ(e.target.value)} className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <select className="input-verus" value={entidade} onChange={(e) => setEntidade(e.target.value)}>
            <option value="">Todas as entidades</option>
            {ENTIDADES_ANEXO.map((e) => (
              <option key={e.chave} value={e.chave}>{e.label}</option>
            ))}
          </select>
          <select className="input-verus" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="imagem">Imagens</option>
            <option value="pdf">PDF</option>
            <option value="planilha">Planilhas</option>
            <option value="outro">Outros</option>
          </select>
        </div>
      </Card>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="table-verus">
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Vínculo</th>
                <th>Tamanho</th>
                <th>Enviado por</th>
                <th>Data</th>
                <th className="text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">Carregando...</td></tr>
              )}
              {!isLoading && itens.length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">Nenhum documento.</td></tr>
              )}
              {itens.map((a) => {
                const href = linkEntidade(a);
                const def = ENTIDADES_ANEXO.find((e) => e.chave === a.entidade);
                return (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-center gap-2 min-w-0">
                        {a.tipo.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.url} alt="" className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0" loading="lazy" />
                        ) : (
                          <span className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"><IconeTipo tipo={a.tipo} /></span>
                        )}
                        <a href={a.url} target="_blank" rel="noreferrer" className="font-medium text-brand-dark hover:underline truncate max-w-[22rem]">{a.nome}</a>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Badge tone="blue">{def?.label ?? a.entidade}</Badge>
                        {href ? (
                          <Link href={href} className="text-sm text-brand hover:underline truncate max-w-[16rem]">{a.entidadeNome ?? a.entidadeId}</Link>
                        ) : (
                          <span className="text-sm text-gray-500">{a.entidadeNome ?? "—"}</span>
                        )}
                      </div>
                    </td>
                    <td className="tabular-nums text-sm">{tamanhoLegivel(a.tamanho)}</td>
                    <td className="text-sm">{a.uploadedBy?.name ?? "—"}</td>
                    <td className="text-sm">{formatDateTime(a.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1 pr-2">
                        <a href={a.url} download={a.nome} target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Baixar">
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => confirm(`Excluir "${a.nome}"?`) && excluir.mutate(a.id, { onError: (e) => alert(e.message) })}
                          className="p-2 rounded hover:bg-red-50 text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {itens.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
            {itens.length} arquivo(s) · {tamanhoLegivel(totalBytes)}
          </div>
        )}
      </Card>

      <ModalUpload open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
