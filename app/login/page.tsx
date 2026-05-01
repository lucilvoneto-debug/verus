"use client";

import { useState } from "react";
import { Droplet } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@verus.com.br");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email,
          password,
          callbackUrl: "/dashboard",
          json: "true",
        }),
      });
      if (res.ok) {
        window.location.href = "/dashboard";
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
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center shadow-lg">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-dark">Verus</h1>
            <p className="text-xs text-gray-500 -mt-1">ERP de Impermeabilização</p>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-semibold mb-1">Entrar</h2>
          <p className="text-sm text-gray-500 mb-6">Acesse sua conta para continuar</p>

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

          <p className="text-xs text-gray-400 mt-6 text-center">
            Demo: admin@verus.com.br / admin123
          </p>
        </div>
      </div>
    </div>
  );
}
