"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  LogIn,
  LogOut,
  PackageMinus,
  AlertTriangle,
  PenTool,
  X,
} from "lucide-react";
import { getCurrentPosition } from "@/lib/geo";
import { SignaturePad } from "./SignaturePad";

type Material = { id: string; nome: string; unidade: string; estoqueAtual: number };

export function CampoObraActions({
  obraId,
  ultimoPontoTipo,
  ultimoPontoData,
  materiais,
  podeAssinar,
  colaboradorVinculado,
}: {
  obraId: string;
  ultimoPontoTipo: string | null;
  ultimoPontoData: string | null;
  materiais: Material[];
  podeAssinar: boolean;
  colaboradorVinculado: boolean;
}) {
  const router = useRouter();
  const [pontoTipo, setPontoTipo] = useState<string | null>(ultimoPontoTipo);
  const [pontoData, setPontoData] = useState<string | null>(ultimoPontoData);
  const [busy, setBusy] = useState<string | null>(null);

  const [openConsumo, setOpenConsumo] = useState(false);
  const [openProblema, setOpenProblema] = useState(false);
  const [openAssinatura, setOpenAssinatura] = useState(false);

  const proximoTipo: "CHECKIN" | "CHECKOUT" =
    pontoTipo === "CHECKIN" ? "CHECKOUT" : "CHECKIN";

  const fazerPonto = async () => {
    if (!colaboradorVinculado) {
      alert("Seu usuário não está vinculado a um colaborador.");
      return;
    }
    setBusy("ponto");
    try {
      const coords = await getCurrentPosition().catch(() => null);
      const path = proximoTipo === "CHECKIN" ? "checkin" : "checkout";
      const res = await fetch(`/api/obras/${obraId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: coords?.lat ?? null, lng: coords?.lng ?? null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Falha ao registrar ponto");
      }
      const now = new Date().toISOString();
      setPontoTipo(proximoTipo);
      setPontoData(now);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500">Ponto atual nesta obra (hoje)</p>
            <p className="text-sm font-semibold text-gray-800">
              {pontoTipo
                ? `${pontoTipo} às ${
                    pontoData
                      ? new Date(pontoData).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"
                  }`
                : "Nenhum registro hoje"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fazerPonto}
          disabled={busy === "ponto" || !colaboradorVinculado}
          className={`w-full inline-flex items-center justify-center gap-2 font-semibold rounded-lg min-h-14 text-base transition-colors disabled:opacity-50 ${
            proximoTipo === "CHECKIN"
              ? "bg-brand hover:bg-brand-dark text-white"
              : "bg-warning hover:bg-amber-600 text-white"
          }`}
        >
          {proximoTipo === "CHECKIN" ? (
            <>
              <LogIn className="w-5 h-5" /> Fazer CHECK-IN
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" /> Fazer CHECK-OUT
            </>
          )}
        </button>
        {!colaboradorVinculado && (
          <p className="mt-2 text-xs text-danger">
            Seu usuário não está vinculado a um colaborador. Procure o administrador.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => setOpenConsumo(true)}
          className="btn-outline min-h-14 justify-start text-left text-base"
        >
          <PackageMinus className="w-5 h-5" />
          <span className="flex-1">Registrar consumo de material</span>
        </button>
        <button
          type="button"
          onClick={() => setOpenProblema(true)}
          className="btn-outline min-h-14 justify-start text-left text-base"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="flex-1">Reportar problema</span>
        </button>
        {podeAssinar && (
          <button
            type="button"
            onClick={() => setOpenAssinatura(true)}
            className="inline-flex items-center justify-start gap-2 bg-success hover:bg-emerald-600 text-white font-medium px-4 rounded-lg min-h-14 text-base"
          >
            <PenTool className="w-5 h-5" />
            <span className="flex-1 text-left">Coletar assinatura do cliente</span>
          </button>
        )}
      </div>

      {openConsumo && (
        <FullScreenModal
          title="Registrar consumo"
          onClose={() => setOpenConsumo(false)}
          icon={<PackageMinus className="w-5 h-5" />}
        >
          <ConsumoForm
            obraId={obraId}
            materiais={materiais}
            onDone={() => {
              setOpenConsumo(false);
              router.refresh();
            }}
          />
        </FullScreenModal>
      )}

      {openProblema && (
        <FullScreenModal
          title="Reportar problema"
          onClose={() => setOpenProblema(false)}
          icon={<AlertTriangle className="w-5 h-5" />}
        >
          <ProblemaForm
            obraId={obraId}
            onDone={() => {
              setOpenProblema(false);
              router.refresh();
            }}
          />
        </FullScreenModal>
      )}

      {openAssinatura && (
        <FullScreenModal
          title="Assinatura do cliente"
          onClose={() => setOpenAssinatura(false)}
          icon={<PenTool className="w-5 h-5" />}
        >
          <AssinaturaForm
            obraId={obraId}
            onDone={() => {
              setOpenAssinatura(false);
              router.refresh();
            }}
          />
        </FullScreenModal>
      )}
    </div>
  );
}

function FullScreenModal({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <header className="sticky top-0 bg-brand-dark text-white px-4 py-3 flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 min-h-10 min-w-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 font-display text-lg font-semibold">
          {icon}
          {title}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 max-w-md w-full mx-auto">{children}</div>
    </div>
  );
}

function ConsumoForm({
  obraId,
  materiais,
  onDone,
}: {
  obraId: string;
  materiais: Material[];
  onDone: () => void;
}) {
  const [materialId, setMaterialId] = useState(materiais[0]?.id ?? "");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(quantidade.replace(",", "."));
    if (!materialId || !q || q <= 0) {
      alert("Selecione um material e informe uma quantidade válida.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/obras/${obraId}/consumo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId, quantidade: q, observacao: observacao || null }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao registrar consumo");
      }
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {materiais.length === 0 ? (
        <p className="text-sm text-gray-600">Nenhum material cadastrado.</p>
      ) : (
        <>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Material</span>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="input-verus min-h-12 text-base"
            >
              {materiais.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome} ({m.unidade}) · estoque {m.estoqueAtual}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Quantidade</span>
            <input
              inputMode="decimal"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="input-verus min-h-12 text-base"
              placeholder="0"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">
              Observação (opcional)
            </span>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              className="input-verus text-base"
            />
          </label>

          <button type="submit" disabled={saving} className="btn-primary w-full min-h-14 text-base">
            {saving ? "Salvando..." : "Registrar saída"}
          </button>
        </>
      )}
    </form>
  );
}

function ProblemaForm({
  obraId,
  onDone,
}: {
  obraId: string;
  onDone: () => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) {
      alert("Descreva o problema.");
      return;
    }
    setSaving(true);
    try {
      const fotosArr = fotos
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch(`/api/obras/${obraId}/diario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: new Date().toISOString(),
          descricao: `[Problema reportado] ${descricao}`,
          problemas: descricao,
          fotos: fotosArr.length ? JSON.stringify(fotosArr) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao reportar problema");
      }
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Descrição do problema
        </span>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={5}
          className="input-verus text-base"
          placeholder="Ex: cliente trocou local da aplicação, falta material..."
        />
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          URLs de fotos (uma por linha, opcional)
        </span>
        <textarea
          value={fotos}
          onChange={(e) => setFotos(e.target.value)}
          rows={3}
          className="input-verus text-base"
          placeholder="https://..."
        />
      </label>

      <button type="submit" disabled={saving} className="btn-primary w-full min-h-14 text-base">
        {saving ? "Enviando..." : "Registrar no diário"}
      </button>
    </form>
  );
}

function AssinaturaForm({ obraId, onDone }: { obraId: string; onDone: () => void }) {
  const [saving, setSaving] = useState(false);

  const save = async (dataUrl: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/obras/${obraId}/assinatura`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, nome: "Assinatura cliente" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao salvar assinatura");
      }
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  };

  return <SignaturePad onSave={save} saving={saving} />;
}
