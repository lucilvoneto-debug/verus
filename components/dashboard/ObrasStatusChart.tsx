"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from "recharts";

type ObraStatusPoint = { status: string; qtd: number; color: string };

export function ObrasStatusChart({ data }: { data: ObraStatusPoint[] }) {
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
