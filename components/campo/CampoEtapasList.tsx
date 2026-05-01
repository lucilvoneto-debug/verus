import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/utils";

type Etapa = {
  id: string;
  ordem: number;
  nome: string;
  status: string;
  dataPrevista: Date;
};

export function CampoEtapasList({ etapas }: { etapas: Etapa[] }) {
  if (etapas.length === 0) {
    return (
      <div className="card text-sm text-gray-600">Sem etapas cadastradas.</div>
    );
  }
  return (
    <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
      {etapas.map((e) => (
        <li key={e.id}>
          <Link
            href={`/campo/etapas/${e.id}`}
            className="flex items-center gap-3 px-4 py-3 active:bg-gray-50 min-h-14"
          >
            <span className="w-7 h-7 rounded-full bg-brand-light text-brand text-xs font-semibold flex items-center justify-center shrink-0">
              {e.ordem}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{e.nome}</p>
              <p className="text-xs text-gray-500">
                Prev. {formatDate(e.dataPrevista)}
              </p>
            </div>
            <StatusBadge status={e.status} />
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
