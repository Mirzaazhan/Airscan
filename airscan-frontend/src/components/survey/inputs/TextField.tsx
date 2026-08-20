'use client';

interface Props { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; }

export function TextField({ value, onChange, placeholder, multiline }: Props) {
  if (multiline) {
    return (
      <textarea className="input-field" rows={4} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
    );
  }
  return (
    <input type="text" className="input-field" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} style={{ width: '100%' }} />
  );
}
