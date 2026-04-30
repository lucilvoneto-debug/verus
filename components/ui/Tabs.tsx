"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type TabItem = { key: string; label: string; content: React.ReactNode };

export function Tabs({ items, defaultKey }: { items: TabItem[]; defaultKey?: string }) {
  const [active, setActive] = useState(defaultKey ?? items[0]?.key);
  const current = items.find((i) => i.key === active);
  return (
    <div>
      <div className="flex border-b border-gray-200 gap-1 mb-4 overflow-x-auto">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => setActive(it.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              active === it.key
                ? "border-brand text-brand"
                : "border-transparent text-gray-600 hover:text-brand-dark"
            )}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}
