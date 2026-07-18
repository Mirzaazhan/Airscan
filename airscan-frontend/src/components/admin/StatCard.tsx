interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div className="label" style={{ marginBottom: 10 }}>{label}</div>
      <div className="serif" style={{ fontSize: 32, color: accent ?? 'var(--ink)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}
