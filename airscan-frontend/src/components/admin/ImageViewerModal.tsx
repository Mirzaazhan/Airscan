'use client';

import { useState } from 'react';
import type { ScanAngle, ScanRecord } from '@/lib/types';
import { useScan } from '@/contexts/ScanContext';
import { updateScanNotes } from '@/lib/admin';

interface Props {
  scan: ScanRecord;
  uid: string;
  onClose: () => void;
  onNotesSaved: (scanId: string, notes: NonNullable<ScanRecord['doctorNotes']>) => void;
}

const ANGLES: ScanAngle[] = ['front', 'left', 'right', 'mouth_open', 'tongue_out', 'tongue_rest', 'neck', 'nasal'];

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function ImageViewerModal({ scan, uid, onClose, onNotesSaved }: Props) {
  const { user } = useScan();
  const [notesText, setNotesText] = useState(scan.doctorNotes?.text ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirty = notesText.trim() !== (scan.doctorNotes?.text ?? '');

  async function handleSaveNotes() {
    if (!user || !dirty) return;
    setSaving(true);
    setSaveError(null);
    try {
      const notes = { text: notesText.trim(), authorName: user.displayName, authorUid: user.uid };
      await updateScanNotes(uid, scan.id, notes);
      onNotesSaved(scan.id, { ...notes, updatedAt: Date.now() });
    } catch {
      setSaveError('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          zIndex: 300,
        }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(880px, 94vw)',
        maxHeight: '90vh',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 301,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div>
            <div className="label" style={{ marginBottom: 2 }}>Captured images</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>{scan.date} · {scan.id.slice(0, 8)}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 22, lineHeight: 1, padding: '4px 8px', fontFamily: 'inherit' }}
            aria-label="Close">
            ×
          </button>
        </div>

        {/* Image grid */}
        <div style={{ overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {ANGLES.map(angle => (
              <div key={angle} style={{ position: 'relative', aspectRatio: '3 / 4', background: 'oklch(0.18 0.02 230)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
                {scan.imageRefs?.[angle] ? (
                  <img
                    src={scan.imageRefs[angle]}
                    alt={`${angle} angle`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'oklch(0.5 0.02 230)', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', padding: 8 }}>
                    No image
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 6, left: 6, padding: '3px 7px', fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {angle.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>

          {/* Doctor notes / ground truth */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
            <div className="label" style={{ marginBottom: 8 }}>Doctor notes / ground truth</div>
            <textarea
              className="input-field"
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
              placeholder="Add clinical notes or ground-truth assessment for this scan…"
              rows={4}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                {saveError
                  ? <span style={{ color: 'var(--terra)' }}>{saveError}</span>
                  : scan.doctorNotes
                    ? `Last updated by ${scan.doctorNotes.authorName} · ${formatDateTime(scan.doctorNotes.updatedAt)}`
                    : 'No notes yet.'}
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSaveNotes}
                disabled={!dirty || saving}
                style={{ fontSize: 12, padding: '8px 16px', opacity: (!dirty || saving) ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
