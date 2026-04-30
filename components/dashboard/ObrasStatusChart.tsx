"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

const data = [
  { status: "Aguardando", qtd: 4, color: "#94A3B8" },
  { status: "Em andamento", qtd: 9, color: "#0B5FFF" },
  { status: "Atrasada", qtd: 2, color: "#EF4444" },
  { status: "Pausada", qtd: 1, color: "#F59E0B" },
  { status: "Finalizada", qtd: 14, color: "#10B981" },
];

export function ObrasStatusChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="status" stroke="#94A3B8" fontSize={12} />
          <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="qtd" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.status} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
