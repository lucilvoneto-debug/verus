"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, FileText, Hammer, ScrollText } from "lucide-react";

interface Resultados {
  clientes: { id: string; nome: string; documento?: string | null }[];
  orcamentos: { id: string; numero: string; total: number; status: string; cliente?: { nome: string } | null }[];
  obras: { id: string; numero: string; nome: string; status: string }[];
  contratos: { id: string; numero: string; status: string }[];
}

const vazio: Resultados = { clientes: [], orcamentos: [], obras: [], contratos: [] };

export default function BuscaPage() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Resultados>(vazio);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) { setRes(vazio); return; }
    setCarregando(true);
    const t = setTimeout(() => {
      fetch(`/api/busca?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j) => setRes(j))
        .catch(() => setRes(vazio))
        .finally(() => setCarregando(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const total = res.clientes.length + res.orcamentos.length + res.obras.length + res.contratos.length;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-brand-dark">Busca</h2>
        <p className="text-sm text-gray-500">Cliente, orçamento, obra ou contrato num campo só.</p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Digite nome, número, documento…"
          className="input-verus !pl-11 !py-3 text-base"
        />
      </div>

      {q.trim().length >= 2 && !carregando && total === 0 && (
        <div className="text-sm text-gray-500">Nada encontrado para “{q}”.</div>
      )}

      {res.clientes.length > 0 && (
        <Grupo titulo="Clientes" icon={<Users className="w-4 h-4" />}>
          {res.clientes.map((c) => (
            <Item key={c.id} href={`/dashboard/clientes/${c.id}`} titulo={c.nome} sub={c.documento ?? undefined} />
          ))}
        </Grupo>
      )}
      {res.orcamentos.length > 0 && (
        <Grupo titulo="Orçamentos" icon={<FileText className="w-4 h-4" />}>
          {res.orcamentos.map((o) => (
            <Item key={o.id} href={`/dashboard/orcamento/${o.id}`} titulo={`${o.numero} · ${o.cliente?.nome ?? ""}`} sub={`${o.status} · R$ ${o.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
          ))}
        </Grupo>
      )}
      {res.obras.length > 0 && (
        <Grupo titulo="Obras" icon={<Hammer className="w-4 h-4" />}>
          {res.obras.map((o) => (
            <Item key={o.id} href={`/dashboard/obras/${o.id}`} titulo={`${o.numero} · ${o.nome}`} sub={o.status} />
          ))}
        </Grupo>
      )}
      {res.contratos.length > 0 && (
        <Grupo titulo="Contratos" icon={<ScrollText className="w-4 h-4" />}>
          {res.contratos.map((c) => (
            <Item key={c.id} href={`/dashboard/contratos/${c.id}`} titulo={c.numero} sub={c.status} />
          ))}
        </Grupo>
      )}
    </div>
  );
}

function Grupo({ titulo, icon, children }: { titulo: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500 mb-2">{icon} {titulo}</div>
      <div className="card !p-0 divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function Item({ href, titulo, sub }: { href: string; titulo: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
      <span className="text-gray-800 font-medium">{titulo}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </Link>
  );
}
