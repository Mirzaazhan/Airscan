'use client';

interface Props { value: string[]; onChange: (v: string[]) => void; options: string[]; maxSelections?: number; }

export function MultiChoiceChecklist({ value, onChange, options, maxSelections }: Props) {
  const atCap = maxSelections !== undefined && value.length >= maxSelections;

  const toggle = (o: string) => {
    if (value.includes(o)) { onChange(value.filter(v => v !== o)); return; }
    if (atCap) return;
    onChange([...value, o]);
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => {
          const selected = value.includes(o);
          const disabled = !selected && atCap;
          return (
            <button key={o} type="button" onClick={() => toggle(o)} disabled={disabled} style={{
              padding: '9px 18px', fontSize: 13, fontWeight: 500,
              background: selected ? 'var(--sage)' : 'var(--surface)',
              color: selected ? 'white' : disabled ? 'var(--ink-4)' : 'var(--ink)',
              border: '1.5px solid ' + (selected ? 'var(--sage)' : 'var(--line)'),
              borderRadius: 'var(--r-full)', cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              opacity: disabled ? 0.55 : 1,
              transition: 'all 0.15s',
            }}>{o}</button>
          );
        })}
      </div>
      {maxSelections !== undefined && (
        <div style={{ marginTop: 8, fontSize: 11, color: atCap ? 'var(--terra)' : 'var(--ink-3)' }}>
          {value.length} / {maxSelections} selected
        </div>
      )}
    </div>
  );
}
