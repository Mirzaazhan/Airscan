'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Props {
  low: number;
  elevated: number;
  high: number;
}

const COLORS = ['var(--sage)', 'var(--amber)', 'var(--terra)'];

export function RiskDistributionChart({ low, elevated, high }: Props) {
  const data = [
    { name: 'Low risk', value: low },
    { name: 'Elevated', value: elevated },
    { name: 'High concern', value: high },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: 200, color: 'var(--ink-3)', fontSize: 13 }}>
        No scan data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ fontFamily: 'var(--font-sans)', fontSize: 13, border: '1px solid var(--line)', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}
          itemStyle={{ color: 'var(--ink)' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--ink-2)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
