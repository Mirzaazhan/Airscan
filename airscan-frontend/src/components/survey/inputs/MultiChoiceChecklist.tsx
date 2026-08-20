'use client';

interface Props { value: string[]; onChange: (v: string[]) => void; options: string[]; }

export function MultiChoiceChecklist({ value, onChange, options }: Props) {
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter(v => v !== o) : [...value, o]);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const selected = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)} style={{
            padding: '9px 18px', fontSize: 13, fontWeight: 500,
            background: selected ? 'var(--sage)' : 'var(--surface)',
            color: selected ? 'white' : 'var(--ink)',
            border: '1.5px solid ' + (selected ? 'var(--sage)' : 'var(--line)'),
            borderRadius: 'var(--r-full)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}>{o}</button>
        );
      })}
    </div>
  );
}
