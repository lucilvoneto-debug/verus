"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("cliente-credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.ok) {
        router.push("/portal");
        router.refresh();
      } else {
        setError("Credenciais inválidas");
      }
    } catch {
      setError("Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-light via-white to-white p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Verus" className="w-20 h-20 object-contain" />
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-brand-dark">Verus</h1>
            <p className="text-xs text-gray-500 -mt-1">Portal do Cliente</p>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-semibold mb-1">Acessar portal</h2>
          <p className="text-sm text-gray-500 mb-6">Acompanhe sua obra e seus documentos</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                className="input-verus"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                className="input-verus"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-xs text-gray-500 hover:text-brand">
              Sou da equipe — acessar ERP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
