"use client";

import { Card } from "@/components/ui/Card";

type Foto = { origem: string; url: string };

export function ObraTabFotos({ fotos }: { fotos: Foto[] }) {
  return (
    <Card>
      <h3 className="font-display text-lg font-semibold mb-4">Fotos da obra</h3>
      {fotos.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhuma foto registrada. As fotos aparecem aqui conforme são adicionadas em etapas e diários.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fotos.map((f, i) => (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg overflow-hidden border border-gray-200 hover:border-brand transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.origem} className="w-full h-32 object-cover bg-gray-100" />
              <div className="px-2 py-1 text-xs text-gray-500 truncate">{f.origem}</div>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
