'use client';

interface Props { value: string; onChange: (v: 'yes' | 'no') => void; }

export function YesNoToggle({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, maxWidth: 280 }}>
      {(['yes', 'no'] as const).map(opt => {
        const selected = value === opt;
        const color = opt === 'yes' ? 'var(--sage)' : 'var(--petrol-ink)';
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)} style={{
            padding: '9px 22px', fontSize: 13, fontWeight: 500, flex: 1,
            background: selected ? color : 'var(--surface)',
            color: selected ? 'white' : 'var(--ink)',
            border: '1.5px solid ' + (selected ? color : 'var(--line)'),
            borderRadius: 'var(--r-sm)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>{opt === 'yes' ? 'Yes' : 'No'}</button>
        );
      })}
    </div>
  );
}
