"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

type Status = {
  ligado: boolean;
  clientIdFinal?: string;
  certValidoAte?: string | null;
  testadoEm?: string | null;
  permissoes?: Record<string, boolean> | null;
  ultimoErro?: string | null;
  saldo?: number | null;
};

const NOME_PERMISSAO: Record<string, string> = {
  extrato: "Extrato e saldo",
  cobranca: "Boleto e PIX para cliente",
  pagaBoleto: "Pagar boleto",
  pagaPix: "Pagar com PIX",
};

const quando = (d?: string | null) =>
  d ? new Date(d).toLocaleString("pt-BR", { timeZone: "America/Maceio", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/** Lê os arquivos escolhidos e separa certificado e chave pelo conteúdo. */
async function lerArquivos(lista: FileList | null) {
  let cert = "";
  let chave = "";
  for (const f of Array.from(lista ?? [])) {
    const t = await f.text();
    if (t.includes("BEGIN CERTIFICATE")) cert = t;
    else if (t.includes("PRIVATE KEY")) chave = t;
  }
  return { cert, chave };
}

export function InterConfigCard() {
  const qc = useQueryClient();
  const { data } = useQuery<Status>({ queryKey: ["inter-config"], queryFn: () => fetch("/api/integracoes/inter").then((r) => r.json()) });
  const [aberto, setAberto] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [arquivos, setArquivos] = useState<{ cert: string; chave: string }>({ cert: "", chave: "" });
  const [erro, setErro] = useState("");

  const salvar = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/integracoes/inter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, cert: arquivos.cert, chave: arquivos.chave }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "Não salvou");
      return j;
    },
    onSuccess: () => {
      setAberto(false);
      setClientId("");
      setClientSecret("");
      setArquivos({ cert: "", chave: "" });
      qc.invalidateQueries({ queryKey: ["inter-config"] });
    },
    onError: (e) => setErro(e instanceof Error ? e.message : "Erro"),
  });

  const ligado = data?.ligado ?? false;
  const vence = data?.certValidoAte ? new Date(data.certValidoAte) : null;
  const venceLogo = vence && vence.getTime() - Date.now() < 30 * 864e5;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-light/40 text-brand flex items-center justify-center shrink-0">
          <Landmark className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-display font-semibold text-brand-dark">Banco Inter</h4>
            <Badge tone={ligado ? "green" : "neutral"}>{ligado ? "Funcionando" : "Desligado"}</Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">Extrato sozinho, boleto com PIX para cliente e pagamento de fornecedor.</p>

          {ligado && (
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div>Testado em {quando(data?.testadoEm)}{data?.saldo != null && <> · saldo {formatCurrency(data.saldo)}</>}</div>
              <div className={venceLogo ? "text-red-600 font-medium" : ""}>
                Certificado vence em {vence ? vence.toLocaleDateString("pt-BR") : "—"}
                {venceLogo && " · gere um novo no Inter antes de vencer"}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {Object.entries(data?.permissoes ?? {}).map(([k, ok]) => (
                  <Badge key={k} tone={ok ? "green" : "red"}>
                    {NOME_PERMISSAO[k] ?? k}: {ok ? "sim" : "sem permissão"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!aberto ? (
            <button className="btn-primary text-sm mt-3 !py-1.5" onClick={() => { setAberto(true); setErro(""); }}>
              {ligado ? "Trocar dados do Inter" : "Ligar o Inter"}
            </button>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <p className="text-gray-500">
                No Internet Banking do Inter: Soluções para sua empresa → Integrações. Depois de salvar, o segredo não aparece mais aqui.
              </p>
              <label className="block">
                Client ID
                <input className="input-verus" value={clientId} onChange={(e) => { setClientId(e.target.value); setErro(""); }} autoComplete="off" />
              </label>
              <label className="block">
                Client Secret
                <input className="input-verus" type="password" value={clientSecret} onChange={(e) => { setClientSecret(e.target.value); setErro(""); }} autoComplete="new-password" />
              </label>
              <label className="block">
                Arquivos do certificado (escolha os dois: o .crt e o .key)
                <input
                  className="input-verus"
                  type="file"
                  multiple
                  accept=".crt,.key,.pem,text/plain"
                  onChange={async (e) => { setArquivos(await lerArquivos(e.target.files)); setErro(""); }}
                />
              </label>
              <div className="text-xs text-gray-500">
                Certificado: {arquivos.cert ? "ok" : "falta"} · Chave: {arquivos.chave ? "ok" : "falta"}
              </div>
              {erro && <p className="text-red-600">{erro}</p>}
              <div className="flex gap-2">
                <button className="btn-outline" onClick={() => setAberto(false)}>Cancelar</button>
                <button
                  className="btn-primary"
                  disabled={salvar.isPending || !clientId || !clientSecret || !arquivos.cert || !arquivos.chave}
                  onClick={() => salvar.mutate()}
                >
                  {salvar.isPending ? "Testando com o banco..." : "Salvar e testar ligação"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
