'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { RiskLevel } from '@/lib/types';

interface ScanPoint {
  createdAt?: number;
  risk: RiskLevel;
}

interface Props {
  scans: ScanPoint[];
  days?: number;
}

function bucketByDay(scans: ScanPoint[], days: number): { date: string; count: number }[] {
  const now = Date.now();
  const buckets: Record<string, number> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    buckets[d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' })] = 0;
  }

  for (const s of scans) {
    if (!s.createdAt) continue;
    const age = now - s.createdAt;
    if (age > days * 86_400_000) continue;
    const key = new Date(s.createdAt).toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
    if (key in buckets) buckets[key]++;
  }

  return Object.entries(buckets).map(([date, count]) => ({ date, count }));
}

export function ActivityChart({ scans, days = 30 }: Props) {
  const data = bucketByDay(scans, days);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={8}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--line)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--ink-3)' }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(days / 7)}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10, fontFamily: 'var(--font-mono)', fill: 'var(--ink-3)' }}
          tickLine={false}
          axisLine={false}
          width={24}
        />
        <Tooltip
          cursor={{ fill: 'var(--paper-2)' }}
          contentStyle={{ fontFamily: 'var(--font-sans)', fontSize: 13, border: '1px solid var(--line)', borderRadius: 8, boxShadow: 'var(--shadow-md)' }}
          itemStyle={{ color: 'var(--ink)' }}
        />
        <Bar dataKey="count" name="Scans" fill="var(--petrol)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
