import Link from "next/link";
import { FileCheck2, ShieldCheck, ScrollText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export type FabricanteResumo = {
  id: string;
  nome: string;
  ativo: boolean;
  catalogoSincronizado: boolean;
  fispqUrl: string | null;
  normasTecnicas: string | null;
  garantiaAnosPadrao: number | null;
  _count?: { produtos: number };
};

// Paleta fixa (classes literais p/ o Tailwind JIT não fazer purge de classes montadas em runtime).
const MONOGRAM_TONES = [
  "bg-brand text-white",
  "bg-emerald-600 text-white",
  "bg-amber-500 text-white",
  "bg-blue-600 text-white",
  "bg-purple-600 text-white",
  "bg-teal-600 text-white",
  "bg-red-500 text-white",
  "bg-indigo-600 text-white",
];

function toneFor(nome: string) {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = (hash * 31 + nome.charCodeAt(i)) >>> 0;
  return MONOGRAM_TONES[hash % MONOGRAM_TONES.length];
}

export function FabricanteCard({ fabricante }: { fabricante: FabricanteResumo }) {
  const inicial = fabricante.nome.trim().charAt(0).toUpperCase() || "?";

  return (
    <Link href={`/dashboard/fabricantes/${fabricante.id}`}>
      <Card className="h-full hover:border-brand hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-display text-lg font-bold shrink-0 ${toneFor(
                fabricante.nome
              )}`}
            >
              {inicial}
            </div>
            <div className="min-w-0">
              <div className="font-display text-base font-semibold text-brand-dark truncate">
                {fabricante.nome}
              </div>
              <div className="text-xs text-gray-500">
                {fabricante._count?.produtos ?? 0} produto{(fabricante._count?.produtos ?? 0) === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <Badge tone={fabricante.ativo ? "green" : "neutral"}>
            {fabricante.ativo ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge tone={fabricante.catalogoSincronizado ? "blue" : "yellow"}>
            {fabricante.catalogoSincronizado ? "Catálogo sincronizado" : "Catálogo pendente"}
          </Badge>
          {fabricante.fispqUrl && (
            <span className="badge-neutral inline-flex items-center gap-1">
              <FileCheck2 className="w-3 h-3" /> FISPQ
            </span>
          )}
          {fabricante.normasTecnicas && (
            <span className="badge-neutral inline-flex items-center gap-1">
              <ScrollText className="w-3 h-3" /> {fabricante.normasTecnicas}
            </span>
          )}
          {fabricante.garantiaAnosPadrao != null && (
            <span className="badge-neutral inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {fabricante.garantiaAnosPadrao} anos garantia
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
