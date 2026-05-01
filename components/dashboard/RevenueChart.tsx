"use client";

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type RevenuePoint = { mes: string; valor: number };

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0B5FFF" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0B5FFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="mes" stroke="#94A3B8" fontSize={12} />
          <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `R$ ${v / 1000}k`} />
          <Tooltip
            formatter={(v: number) =>
              v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            }
          />
          <Area
            type="monotone"
            dataKey="valor"
            stroke="#0B5FFF"
            strokeWidth={2}
            fill="url(#colorRev)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
