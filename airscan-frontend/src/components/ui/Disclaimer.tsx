export function Disclaimer() {
  return (
    <div style={{
      fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5,
      padding: '10px 14px', background: 'var(--paper-2)',
      borderRadius: 'var(--r-sm)', border: '1px solid var(--line)',
    }}>
      <span className="label" style={{ color: 'var(--ink-3)', fontSize: 9, marginRight: 6 }}>Disclaimer</span>
      This is a pre-screening tool only and does not constitute a medical diagnosis.
    </div>
  );
}
