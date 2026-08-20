'use client';

interface Props { value: string; onChange: (v: string) => void; options: string[]; }

export function SingleChoicePills({ value, onChange, options }: Props) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)} style={{
          padding: '9px 18px', fontSize: 13, fontWeight: 500,
          background: value === o ? 'var(--petrol)' : 'var(--surface)',
          color: value === o ? 'white' : 'var(--ink)',
          border: '1.5px solid ' + (value === o ? 'var(--petrol)' : 'var(--line)'),
          borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}>{o}</button>
      ))}
    </div>
  );
}
