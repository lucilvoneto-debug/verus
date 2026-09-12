"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Chamado a cada arquivo salvo, com a URL pronta para <img>/<a>. */
  onUpload: (arquivo: { url: string; nome: string; mime: string; tamanho: number }) => void;
  /** Pasta lógica no storage: diario | etapa | visita | anexo | ... */
  contexto?: string;
  /** "imagem" só aceita foto (celular oferece câmera ou galeria) e comprime; "arquivo" aceita PDF/planilha. */
  tipo?: "imagem" | "arquivo";
  multiplo?: boolean;
  label?: string;
  className?: string;
  disabled?: boolean;
};

const LADO_MAX = 1600;
const QUALIDADE = 0.82;

/** Reduz a imagem no navegador antes de subir (celular manda 4–8 MB por foto). */
async function comprimirImagem(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && file.size < 900 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", QUALIDADE));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function enviarArquivo(file: File, contexto = "geral") {
  const corpo = file.type.startsWith("image/") ? await comprimirImagem(file) : file;
  const nome = corpo === file ? file.name : file.name.replace(/\.[a-z0-9]+$/i, "") + ".jpg";
  const fd = new FormData();
  fd.append("file", corpo, nome);
  fd.append("contexto", contexto);
  const r = await fetch("/api/foto", { method: "POST", body: fd });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "Falha no upload");
  return { url: d.url as string, nome, mime: d.mime as string, tamanho: d.tamanho as number };
}

export function UploadFoto({
  onUpload,
  contexto = "geral",
  tipo = "imagem",
  multiplo = true,
  label,
  className,
  disabled,
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setEnviando(true);
    setErro(null);
    try {
      for (const f of files) {
        const salvo = await enviarArquivo(f, contexto);
        onUpload(salvo);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setEnviando(false);
    }
  }

  const Icone = tipo === "imagem" ? Camera : Paperclip;
  const accept = tipo === "imagem" ? "image/*" : "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.dwg,.dxf";

  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiplo}
        className="hidden"
        onChange={onChange}
        disabled={disabled || enviando}
      />
      <button
        type="button"
        className="btn-outline"
        onClick={() => ref.current?.click()}
        disabled={disabled || enviando}
      >
        {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icone className="w-4 h-4" />}
        {enviando ? "Enviando…" : label ?? (tipo === "imagem" ? "Adicionar foto" : "Anexar arquivo")}
      </button>
      {erro && <span className="text-xs text-danger">{erro}</span>}
    </div>
  );
}
