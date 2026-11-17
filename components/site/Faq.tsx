import { ChevronDown } from "lucide-react";
import type { Pergunta } from "@/lib/site/perguntas";

/**
 * FAQ em acordeão sem JavaScript (<details>): todas as respostas saem no HTML do servidor,
 * então Google, ChatGPT e Perplexity leem tudo mesmo com o item fechado.
 * Pergunta como <h3> (a seção tem o <h2>); resposta direta primeiro, detalhe depois.
 * name="faq" faz abrir um item por vez nos navegadores que suportam (uma FAQ por página).
 */
export function Faq({ itens, tema = "claro" }: { itens: Pergunta[]; tema?: "claro" | "escuro" }) {
  const escuro = tema === "escuro";
  return (
    <div className={escuro ? "divide-y divide-verus-line rounded-lg border border-verus-line bg-verus-card" : "divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white"}>
      {itens.map((it, i) => (
        <details key={it.p} name="faq" open={i === 0} className="group">
          <summary
            className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-medium [&::-webkit-details-marker]:hidden ${escuro ? "text-verus-text hover:bg-verus-bg2" : "text-gray-900 hover:bg-gray-50"}`}
          >
            <h3>{it.p}</h3>
            <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className={`px-5 pb-4 space-y-2 text-sm ${escuro ? "text-verus-muted" : "text-gray-600"}`}>
            <p>{it.r}</p>
            {it.d && <p>{it.d}</p>}
          </div>
        </details>
      ))}
    </div>
  );
}
