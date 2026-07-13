"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Save, MessageCircle, FileText, ExternalLink, QrCode } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Configuracao = { id: string; chave: string; valor: string; descricao?: string | null };
type IntegracaoStatus = { provider: string; connected: boolean };
type StatusResponse = {
  whatsapp: IntegracaoStatus;
  nfe: IntegracaoStatus;
};

const EMPRESA_KEYS = [
  { chave: "empresa.nome", label: "Nome da empresa" },
  { chave: "empresa.cnpj", label: "CNPJ" },
  { chave: "empresa.endereco", label: "Endereço" },
  { chave: "empresa.telefone", label: "Telefone" },
  { chave: "empresa.email", label: "E-mail" },
] as const;

export default function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { data: configsData } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const res = await fetch("/api/configuracoes");
      if (!res.ok) throw new Error("Erro ao carregar configurações");
      return (await res.json()) as { data: Configuracao[] };
    },
  });

  const { data: statusData } = useQuery({
    queryKey: ["integracoes-status"],
    queryFn: async () => {
      const res = await fetch("/api/integracoes/status");
      if (!res.ok) throw new Error("Erro ao carregar status");
      return (await res.json()) as StatusResponse;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!configsData?.data) return;
    const next: Record<string, string> = {};
    for (const k of EMPRESA_KEYS) {
      const found = configsData.data.find((c) => c.chave === k.chave);
      next[k.chave] = found?.valor ?? "";
    }
    setForm(next);
  }, [configsData?.data]);

  const salvar = useMutation({
    mutationFn: async () => {
      const items = EMPRESA_KEYS.map((k) => ({
        chave: k.chave,
        valor: form[k.chave] ?? "",
      }));
      const res = await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["configuracoes"] });
      alert("Configurações salvas.");
    },
    onError: (e) => alert(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-dark">Configurações</h2>
        <p className="text-sm text-gray-500">Dados da empresa e integrações.</p>
      </div>

      <Card>
        <h3 className="font-display text-lg font-semibold text-brand-dark mb-4">
          Dados da empresa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EMPRESA_KEYS.map((k) => (
            <div key={k.chave}>
              <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
                {k.label}
              </label>
              <input
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={form[k.chave] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [k.chave]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button
            className="btn-primary"
            disabled={salvar.isPending}
            onClick={() => salvar.mutate()}
          >
            <Save className="w-4 h-4" /> Salvar
          </button>
        </div>
      </Card>

      <div>
        <h3 className="font-display text-lg font-semibold text-brand-dark mb-2">Integrações</h3>
        <p className="text-sm text-gray-500 mb-4">
          O status é definido pelas variáveis de ambiente. Defina <code>*_PROVIDER</code> e o token correspondente para ativar.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IntegracaoCard
            icon={<MessageCircle className="w-5 h-5" />}
            titulo="WhatsApp"
            descricao="Envio de mensagens (Z-API ou Evolution API)."
            envs={["WHATSAPP_PROVIDER", "WHATSAPP_TOKEN", "WHATSAPP_INSTANCE"]}
            docsUrl="https://developer.z-api.io/"
            status={statusData?.whatsapp}
            manageUrl="/dashboard/configuracoes/whatsapp"
          />
          <IntegracaoCard
            icon={<FileText className="w-5 h-5" />}
            titulo="NF-e / NFS-e"
            descricao="Emissão de notas fiscais de serviço."
            envs={["NFE_PROVIDER", "NFE_TOKEN"]}
            docsUrl="https://nfe.io/docs/nota-fiscal-de-servico/"
            status={statusData?.nfe}
          />
        </div>
      </div>
    </div>
  );
}

function IntegracaoCard({
  icon,
  titulo,
  descricao,
  envs,
  docsUrl,
  status,
  manageUrl,
}: {
  icon: React.ReactNode;
  titulo: string;
  descricao: string;
  envs: string[];
  docsUrl: string;
  status?: IntegracaoStatus;
  manageUrl?: string;
}) {
  const connected = status?.connected ?? false;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-light/40 text-brand flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-semibold text-brand-dark">{titulo}</h4>
            <Badge tone={connected ? "green" : "neutral"}>
              {connected ? "Conectado" : "Desconectado"}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">{descricao}</p>
          <div className="text-xs text-gray-500 mt-2">
            Provider: <code>{status?.provider ?? "—"}</code>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Variáveis de env: {envs.map((e) => <code key={e} className="mr-1">{e}</code>)}
          </div>
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand hover:underline mt-2 inline-flex items-center gap-1"
          >
            Documentação <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {manageUrl && (
            <Link href={manageUrl} className="btn-primary text-sm mt-3 !py-1.5">
              <QrCode className="w-4 h-4" /> Conectar / Ver QR
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
