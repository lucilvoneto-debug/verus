"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Cloud,
  Folder,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
}
interface Doc {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
  entidadeId: string;
  createdAt: string;
}
interface Crumb {
  id: string;
  name: string;
}

function fmtBytes(n?: number | string) {
  const b = Number(n) || 0;
  if (!b) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = b;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}
function fmtDate(s?: string) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}
function tipoCurto(mime: string) {
  if (mime.includes("folder")) return "Pasta";
  if (mime.includes("pdf")) return "PDF";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("sheet"))
    return "Planilha";
  if (mime.includes("document") || mime.includes("word")) return "Documento";
  if (mime.includes("image")) return "Imagem";
  const ext = mime.split("/")[1];
  return ext ? ext.toUpperCase().slice(0, 8) : "Arquivo";
}

export function DocumentosClient() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/integracoes/google/drive?status=1");
      const j = await r.json();
      setConnected(!!j.connected);
      setEmail(j.email ?? null);
    } catch {
      setConnected(false);
    }
  }, []);

  const loadDocs = useCallback(async () => {
    try {
      const r = await fetch("/api/documentos");
      const j = await r.json();
      setDocs(j.docs ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    // Mensagem de retorno do OAuth
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("drive_ok")) setBanner({ kind: "ok", msg: "Google Drive conectado." });
    else if (sp.get("drive_error"))
      setBanner({ kind: "err", msg: `Falha ao conectar: ${sp.get("drive_error")}` });
    if (sp.get("drive_ok") || sp.get("drive_error")) {
      window.history.replaceState({}, "", "/dashboard/documentos");
    }
    Promise.all([loadStatus(), loadDocs()]).finally(() => setLoading(false));
  }, [loadStatus, loadDocs]);

  async function removerDoc(id: string) {
    if (!confirm("Remover este documento do ERP? (não apaga nada no seu Drive)")) return;
    await fetch(`/api/documentos?id=${id}`, { method: "DELETE" });
    setDocs((d) => d.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Documentos</h2>
          <p className="text-sm text-gray-500">
            Puxe arquivos direto do seu Google Drive para o ERP.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <>
              <Badge tone="green" className="hidden sm:inline-flex items-center">
                <Cloud className="w-3.5 h-3.5 mr-1" />
                {email || "Drive conectado"}
              </Badge>
              <Button onClick={() => setPickerOpen(true)}>
                <Cloud className="w-4 h-4 mr-1" /> Importar do Drive
              </Button>
            </>
          ) : (
            <Button onClick={() => (window.location.href = "/api/integracoes/google/connect")}>
              <Cloud className="w-4 h-4 mr-1" /> Conectar Google Drive
            </Button>
          )}
        </div>
      </div>

      {banner && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {banner.kind === "ok" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {banner.msg}
        </div>
      )}

      {loading ? (
        <Card className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
        </Card>
      ) : !connected ? (
        <Card className="flex flex-col items-center justify-center text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mb-4">
            <Cloud className="w-7 h-7" />
          </div>
          <CardTitle>Conecte seu Google Drive</CardTitle>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Autorize o acesso somente-leitura. O ERP nunca altera nem apaga nada no seu Drive —
            só lê e importa o que você escolher. Não pede senha; usa a conta já logada.
          </p>
          <Button
            className="mt-5"
            onClick={() => (window.location.href = "/api/integracoes/google/connect")}
          >
            <Cloud className="w-4 h-4 mr-1" /> Conectar Google Drive
          </Button>
        </Card>
      ) : docs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-brand-light text-brand flex items-center justify-center mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <CardTitle>Nenhum documento importado</CardTitle>
          <p className="text-sm text-gray-500 mt-2 max-w-md">
            Clique em <strong>Importar do Drive</strong>, navegue pelas pastas e escolha os
            arquivos que quer trazer para o ERP.
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Tipo</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Tamanho</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Importado</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand shrink-0" />
                      <span className="truncate max-w-[16rem]">{d.nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                    {tipoCurto(d.tipo)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {fmtBytes(d.tamanho)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {fmtDate(d.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded hover:bg-brand-light text-brand"
                        title="Abrir / baixar"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => removerDoc(d.id)}
                        className="p-2 rounded hover:bg-red-50 text-red-500"
                        title="Remover do ERP"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <DrivePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onImported={(n) => {
          setPickerOpen(false);
          if (n > 0) {
            setBanner({ kind: "ok", msg: `${n} arquivo(s) importado(s).` });
            loadDocs();
          }
        }}
      />
    </div>
  );
}

function DrivePicker({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (n: number) => void;
}) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([{ id: "root", name: "Meu Drive" }]);
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [files, setFiles] = useState<DriveItem[]>([]);
  const [sel, setSel] = useState<Record<string, DriveItem>>({});
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cur = crumbs[crumbs.length - 1];

  const load = useCallback(async (folderId: string) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(`/api/integracoes/google/drive?folderId=${encodeURIComponent(folderId)}`);
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "Falha ao listar");
        setFolders([]);
        setFiles([]);
        return;
      }
      setFolders(j.folders ?? []);
      setFiles(j.files ?? []);
    } catch {
      setErr("Falha de conexão");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setCrumbs([{ id: "root", name: "Meu Drive" }]);
      setSel({});
      load("root");
    }
  }, [open, load]);

  function enterFolder(f: DriveItem) {
    setCrumbs((c) => [...c, { id: f.id, name: f.name }]);
    load(f.id);
  }
  function goCrumb(i: number) {
    const next = crumbs.slice(0, i + 1);
    setCrumbs(next);
    load(next[next.length - 1].id);
  }
  function toggle(f: DriveItem) {
    setSel((s) => {
      const n = { ...s };
      if (n[f.id]) delete n[f.id];
      else n[f.id] = f;
      return n;
    });
  }

  async function importar() {
    const chosen = Object.values(sel);
    if (chosen.length === 0) return;
    setImporting(true);
    try {
      const r = await fetch("/api/documentos/importar-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: chosen.map((f) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
          })),
        }),
      });
      const j = await r.json();
      onImported(Number(j.importados) || 0);
    } catch {
      setErr("Falha ao importar");
    } finally {
      setImporting(false);
    }
  }

  const nSel = Object.keys(sel).length;

  return (
    <Modal open={open} onClose={onClose} title="Importar do Google Drive">
      <div className="space-y-3 min-w-[min(90vw,560px)]">
        {/* breadcrumb */}
        <div className="flex items-center gap-1 text-sm flex-wrap">
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
              <button
                onClick={() => goCrumb(i)}
                className={`px-1.5 py-0.5 rounded hover:bg-gray-100 ${
                  i === crumbs.length - 1 ? "font-medium text-brand-dark" : "text-gray-500"
                }`}
              >
                {c.name}
              </button>
            </span>
          ))}
          <button
            onClick={() => load(cur.id)}
            className="ml-auto p-1.5 rounded hover:bg-gray-100 text-gray-400"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          </button>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4" /> {err}
          </div>
        )}

        {/* lista */}
        <div className="border rounded-lg divide-y divide-gray-100 max-h-[46vh] overflow-auto">
          {busy && folders.length === 0 && files.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
            </div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-400">Pasta vazia</div>
          ) : (
            <>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => enterFolder(f)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50"
                >
                  <Folder className="w-4 h-4 text-brand shrink-0" />
                  <span className="truncate flex-1">{f.name}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
              {files.map((f) => {
                const on = !!sel[f.id];
                return (
                  <button
                    key={f.id}
                    onClick={() => toggle(f)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        on ? "bg-brand border-brand text-white" : "border-gray-300"
                      }`}
                    >
                      {on && <Check className="w-3 h-3" />}
                    </span>
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-xs text-gray-400">{fmtBytes(f.size)}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-sm text-gray-500">
            {nSel > 0 ? `${nSel} selecionado(s)` : "Marque os arquivos"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancelar
            </Button>
            <Button onClick={importar} disabled={nSel === 0 || importing}>
              {importing ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              Importar {nSel > 0 ? `(${nSel})` : ""}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
