"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Factory } from "lucide-react";
import { useFabricantes } from "@/hooks/useFabricantes";
import { Card } from "@/components/ui/Card";
import { FabricanteCard, type FabricanteResumo } from "@/components/fabricantes/FabricanteCard";

export default function FabricantesPage() {
  const [q, setQ] = useState("");
  const [ativo, setAtivo] = useState("");

  const { data, isLoading } = useFabricantes({ q, ativo, pageSize: 100 });
  const fabricantes: FabricanteResumo[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold text-brand-dark">Fabricantes</h2>
          <p className="text-sm text-gray-500">
            Marcas dos produtos usados nas obras (Viapol, Sika, Quartzolit...).
          </p>
        </div>
        <Link href="/dashboard/fabricantes/novo" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo fabricante
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-3 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              placeholder="Buscar por nome..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
          <select className="input-verus" value={ativo} onChange={(e) => setAtivo(e.target.value)}>
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </div>
      </Card>

      {isLoading && <div className="text-center text-gray-500 py-12">Carregando...</div>}

      {!isLoading && fabricantes.length === 0 && (
        <Card className="text-center py-12">
          <Factory className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum fabricante cadastrado.</p>
          <Link href="/dashboard/fabricantes/novo" className="btn-primary inline-flex mt-4">
            <Plus className="w-4 h-4" /> Novo fabricante
          </Link>
        </Card>
      )}

      {!isLoading && fabricantes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {fabricantes.map((f) => (
            <FabricanteCard key={f.id} fabricante={f} />
          ))}
        </div>
      )}
    </div>
  );
}
