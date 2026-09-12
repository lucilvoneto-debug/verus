"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Image as ImageIcon, Loader2, Paperclip, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export type AnexoItem = {
  id: string;
  entidade: string;
  entidadeId: string;
  entidadeNome?: string | null;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
};

export function tamanhoLegivel(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function IconeTipo({ tipo, className = "w-4 h-4" }: { tipo: string; className?: string }) {
  if (tipo.startsWith("image/")) return <ImageIcon className={className} />;
  if (tipo === "application/pdf") return <FileText className={className} />;
  return <Paperclip className={className} />;
}

export function useAnexos(params: { entidade?: string; entidadeId?: string; q?: string; tipo?: string; pageSize?: number }) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && sp.set(k, String(v)));
  return useQuery<{ data: AnexoItem[]; total: number }>({
    queryKey: ["anexos", params],
    queryFn: async () => {
      const r = await fetch(`/api/anexos?${sp}`);
      if (!r.ok) throw new Error("Erro ao carregar anexos");
      return r.json();
    },
  });
}

export function useEnviarAnexo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; entidade: string; entidadeId?: string; nome?: string }) => {
      const fd = new FormData();
      fd.append("file", input.file);
      fd.append("entidade", input.entidade);
      if (input.entidadeId) fd.append("entidadeId", input.entidadeId);
      if (input.nome) fd.append("nome", input.nome);
      const r = await fetch("/api/anexos", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha ao anexar");
      return d as AnexoItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anexos"] }),
  });
}

export function useExcluirAnexo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/anexos/${id}`, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Falha ao excluir");
      return d;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["anexos"] }),
  });
}

/**
 * Lista + upload de anexos de uma entidade. Usar em abas de detalhe
 * (Cliente, Obra, Contrato...). Sem entidadeId lista tudo da entidade.
 */
export function AnexosPanel({
  entidade,
  entidadeId,
  compacto = false,
}: {
  entidade: string;
  entidadeId: string;
  compacto?: boolean;
}) {
  const { data, isLoading } = useAnexos({ entidade, entidadeId, pageSize: 200 });
  const enviar = useEnviarAnexo();
  const excluir = useExcluirAnexo();
  const [erro, setErro] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setErro(null);
    for (const f of files) {
      try {
        await enviar.mutateAsync({ file: f, entidade, entidadeId });
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Falha ao anexar");
      }
    }
  }

  const itens = data?.data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          {isLoading ? "Carregando…" : `${itens.length} arquivo(s)`}
        </p>
        <label className="btn-outline cursor-pointer">
          {enviar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          {enviar.isPending ? "Enviando…" : "Anexar arquivo"}
          <input type="file" multiple className="hidden" onChange={onFiles} disabled={enviar.isPending} />
        </label>
      </div>
      {erro && <p className="text-xs text-danger">{erro}</p>}

      {itens.length === 0 && !isLoading && (
        <p className="text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg p-4 text-center">
          Nenhum anexo. PDF, foto, planilha, DWG — até 15 MB.
        </p>
      )}

      <ul className={compacto ? "space-y-1" : "grid grid-cols-1 md:grid-cols-2 gap-2"}>
        {itens.map((a) => (
          <li key={a.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2 bg-white">
            {a.tipo.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt="" className="w-10 h-10 rounded object-cover bg-gray-100 shrink-0" loading="lazy" />
            ) : (
              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                <IconeTipo tipo={a.tipo} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <a href={a.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-dark hover:underline truncate block">
                {a.nome}
              </a>
              <p className="text-xs text-gray-500 truncate">
                {tamanhoLegivel(a.tamanho)} · {a.uploadedBy?.name ?? "—"} · {formatDateTime(a.createdAt)}
              </p>
            </div>
            <a href={a.url} download={a.nome} target="_blank" rel="noreferrer" className="p-2 rounded hover:bg-gray-100 text-gray-600" title="Baixar">
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => confirm(`Excluir "${a.nome}"?`) && excluir.mutate(a.id, { onError: (e) => setErro(e.message) })}
              className="p-2 rounded hover:bg-red-50 text-red-600"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
