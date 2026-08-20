'use client';

interface Props {
  value: number | undefined;
  onChange: (v: number) => void;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export function ScaleSelector({ value, onChange, min, max, minLabel, maxLabel }: Props) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        {nums.map(n => {
          const selected = value === n;
          return (
            <button key={n} type="button" onClick={() => onChange(n)} style={{
              width: 40, height: 40, fontSize: 14, fontWeight: 600,
              background: selected ? 'var(--petrol)' : 'var(--surface)',
              color: selected ? 'white' : 'var(--ink)',
              border: '1.5px solid ' + (selected ? 'var(--petrol)' : 'var(--line)'),
              borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'var(--font-mono)',
              transition: 'all 0.15s',
            }}>{n}</button>
          );
        })}
      </div>
      {(minLabel || maxLabel) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--ink-3)', maxWidth: (max - min + 1) * 48 }}>
          <span>{minLabel}</span><span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
