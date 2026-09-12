"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function Faq({ itens }: { itens: { p: string; r: string }[] }) {
  const [aberto, setAberto] = useState<number | null>(0);
  return (
    <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
      {itens.map((it, i) => (
        <div key={it.p}>
          <button
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-gray-900 hover:bg-gray-50"
            onClick={() => setAberto(aberto === i ? null : i)}
            aria-expanded={aberto === i}
          >
            {it.p}
            <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${aberto === i ? "rotate-180" : ""}`} />
          </button>
          {aberto === i && <p className="px-5 pb-4 text-sm text-gray-600">{it.r}</p>}
        </div>
      ))}
    </div>
  );
}
