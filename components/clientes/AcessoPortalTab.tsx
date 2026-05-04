"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type AcessoInfo = {
  id: string;
  email: string;
  ativo: boolean;
  ultimoLogin: string | null;
  createdAt: string;
} | null;

export function AcessoPortalTab({ clienteId, clienteEmail }: { clienteId: string; clienteEmail?: string | null }) {
  const [acesso, setAcesso] = useState<AcessoInfo>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [email, setEmail] = useState(clienteEmail ?? "");
  const [senha, setSenha] = useState("");
  const [credencial, setCredencial] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/acesso`);
      if (res.ok) {
        const data = await res.json();
        setAcesso(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  async function criar() {
    setWorking(true);
    setErro(null);
    setCredencial(null);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/acesso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          senha: senha || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Erro ao criar acesso");
        return;
      }
      setCredencial(`E-mail: ${data.email}\nSenha: ${data.senhaTemporaria}`);
      setSenha("");
      await carregar();
    } finally {
      setWorking(false);
    }
  }

  async function resetar() {
    if (!confirm("Resetar a senha do cliente? A senha atual deixará de funcionar.")) return;
    setWorking(true);
    setErro(null);
    setCredencial(null);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/acesso`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: "RESET_SENHA" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Erro ao resetar");
        return;
      }
      setCredencial(`Nova senha: ${data.senhaTemporaria}`);
    } finally {
      setWorking(false);
    }
  }

  async function alternarAtivo() {
    if (!acesso) return;
    setWorking(true);
    try {
      await fetch(`/api/clientes/${clienteId}/acesso`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao: acesso.ativo ? "DESATIVAR" : "ATIVAR" }),
      });
      await carregar();
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-gray-500">Carregando...</p>
      </Card>
    );
  }

  if (!acesso) {
    return (
      <Card>
        <h3 className="font-display text-lg font-semibold mb-2">Criar acesso ao portal</h3>
        <p className="text-sm text-gray-600 mb-4">
          Permite que o cliente acesse o Portal Verus para acompanhar a obra, baixar
          documentos e abrir chamados.
        </p>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              className="input-verus"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha (opcional — gera automaticamente se vazio)
            </label>
            <input
              type="text"
              className="input-verus"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          {credencial && (
            <pre className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-md whitespace-pre-wrap">
              {credencial}
              {"\n\nGuarde essas credenciais agora — não serão exibidas novamente."}
            </pre>
          )}
          <button onClick={criar} className="btn-primary" disabled={working}>
            {working ? "Criando..." : "Criar acesso"}
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-semibold">Acesso ao portal</h3>
        <Badge tone={acesso.ativo ? "green" : "neutral"}>
          {acesso.ativo ? "Ativo" : "Inativo"}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <p className="text-xs uppercase text-gray-500">E-mail</p>
          <p className="text-gray-900">{acesso.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Último login</p>
          <p className="text-gray-900">
            {acesso.ultimoLogin ? new Date(acesso.ultimoLogin).toLocaleString("pt-BR") : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Criado em</p>
          <p className="text-gray-900">
            {new Date(acesso.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
      {erro && <p className="text-sm text-danger mb-2">{erro}</p>}
      {credencial && (
        <pre className="text-xs bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-md mb-3 whitespace-pre-wrap">
          {credencial}
          {"\n\nGuarde essa senha agora — não será exibida novamente."}
        </pre>
      )}
      <div className="flex flex-wrap gap-2">
        <button onClick={resetar} className="btn-outline" disabled={working}>
          Resetar senha
        </button>
        <button onClick={alternarAtivo} className="btn-outline" disabled={working}>
          {acesso.ativo ? "Desativar" : "Ativar"}
        </button>
      </div>
    </Card>
  );
}
