'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScan } from '@/contexts/ScanContext';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconCheck, IconDownload, IconDocument, IconHistory } from '@/components/ui/Icons';
import { ThreeDModel } from '@/components/ThreeDModel';
import { downloadPDF } from '@/lib/pdf';
import { updateScanNotes } from '@/lib/admin';
import type { RiskLevel, CraniofacialMeasurement } from '@/lib/types';

const COLOR_MAP: Record<RiskLevel, { ring: string; bg: string; ink: string; label: string }> = {
  green:  { ring: 'var(--sage)',  bg: 'var(--sage-bg)',  ink: 'var(--sage-ink)',  label: 'Low risk' },
  yellow: { ring: 'var(--amber)', bg: 'var(--amber-bg)', ink: 'var(--amber-ink)', label: 'Elevated' },
  red:    { ring: 'var(--terra)', bg: 'var(--terra-bg)', ink: 'var(--terra-ink)', label: 'High concern' },
};
const FLAG_COLOR: Record<CraniofacialMeasurement['flag'], string> = {
  normal: 'var(--sage)', elevated: 'var(--amber)', high: 'var(--terra)',
};

type Tab = 'summary' | 'measurements' | '3d';

function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ResultsPage() {
  const router = useRouter();
  const { result, demographics, stopBang, psq, patientType, user, isAdmin } = useScan();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [plyLoading, setPlyLoading] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [savedNotes, setSavedNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesSavedMeta, setNotesSavedMeta] = useState<{ authorName: string; updatedAt: number } | null>(null);

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
        <TopBar />
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)' }}>
          No result available. <button className="btn btn-ghost" onClick={() => router.push('/scan')}>Start a scan</button>
        </div>
      </div>
    );
  }

  const c = COLOR_MAP[result.risk];
  const demo = demographics ?? { age: 42, gender: 'Male', weight: 78, height: 172, race: 'Malay', patientType: 'adult' as const };
  const bmi = demo.weight / Math.pow(demo.height / 100, 2);
  const date = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

  // Derive real bar values from computed measurements
  const mByName = new Map(result.measurements?.map(m => [m.name, m.valueMm]) ?? []);
  const bizygomatic = mByName.get('Bizygomatic Width');
  const bigonial    = mByName.get('Bigonial Width');
  const totalHeight = mByName.get('Total Facial Height');
  const lowerHeight = mByName.get('Lower Face Height');

  // Bigonial / Bizygomatic — normal ~0.73; narrower jaw (<0.65) is risky
  const jawToSkull = bizygomatic && bigonial ? Math.min(0.99, bigonial / bizygomatic) : 0.62;
  const jawFlag: 'normal' | 'elevated' | 'high' = jawToSkull < 0.65 ? 'high' : jawToSkull < 0.70 ? 'elevated' : 'normal';

  // Lower face / total face — normal ~0.55–0.60; vertical pattern (>0.63) increases risk
  const lowerFaceRatio = lowerHeight && totalHeight
    ? Math.min(0.99, lowerHeight / totalHeight)
    : (result.risk === 'red' ? 0.78 : result.risk === 'yellow' ? 0.65 : 0.44);
  const lowerFaceFlag: 'normal' | 'elevated' | 'high' = lowerFaceRatio > 0.65 ? 'high' : lowerFaceRatio > 0.60 ? 'elevated' : 'normal';

  // Bizygomatic / (2 × totalHeight) — normalises ~1.1–1.3 ratio to 0–1 range
  const facialRatio = bizygomatic && totalHeight ? Math.min(0.99, bizygomatic / (totalHeight * 2)) : 0.55;

  // Sex factor from real demographics
  const g = demo.gender.toLowerCase();
  const sexFactor = g === 'male' ? 0.72 : g === 'female' ? 0.38 : 0.50;

  // Profile & oral measurements from the measurements array
  const getMeasure = (n: string) => result.measurements?.find(m => m.name === n);
  const chinProj   = getMeasure('Chin Projection');
  const facialConv = getMeasure('Facial Convexity');
  const maxConstrM = getMeasure('Maxillary Width Index');
  const lipGapM    = getMeasure('Resting Lip Gap');

  // Build summary bar rows: [label, barValue 0–1, flag, displayText?]
  const cranioRows: Array<[string, number, string, string?]> = [
    ['Jaw-to-skull ratio',    jawToSkull,    jawFlag],
    ['Lower face ratio',      lowerFaceRatio, lowerFaceFlag],
    [`Mallampati Class ${result.mallampatiScore || 2}`, (result.mallampatiScore || 2) / 4, (result.mallampatiScore || 2) >= 3 ? 'high' : (result.mallampatiScore || 2) === 2 ? 'elevated' : 'normal'],
    ['Facial width / height', facialRatio,   'normal'],
    ['Neck circumference', result.neckMeasurement ? Math.min(1, result.neckMeasurement.circumferenceMm / 500) : 0.48, result.neckMeasurement ? (result.neckMeasurement.circumferenceMm > (g === 'male' ? 430 : 400) ? 'high' : result.neckMeasurement.circumferenceMm > (g === 'male' ? 390 : 370) ? 'elevated' : 'normal') : 'normal', result.neckMeasurement ? `${Math.round(result.neckMeasurement.circumferenceMm)} mm` : '–'],
  ];
  // Append profile & oral rows only when the capture was done
  if (chinProj)   cranioRows.push(['Chin Projection',  Math.min(1, Math.max(0, (chinProj.valueMm   + 5) / 20)),    chinProj.flag,   `${chinProj.valueMm} mm`]);
  if (facialConv) cranioRows.push(['Facial Convexity', Math.min(1, Math.max(0, (facialConv.valueMm - 150) / 30)),  facialConv.flag, `${facialConv.valueMm}°`]);
  if (maxConstrM) cranioRows.push(['Maxillary Index',  Math.min(1, maxConstrM.valueMm / 25),                       maxConstrM.flag, `${maxConstrM.valueMm}%`]);
  if (lipGapM)    cranioRows.push(['Resting Lip Gap',  Math.min(1, lipGapM.valueMm    / 8),                        lipGapM.flag,    `${lipGapM.valueMm} mm`]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF({
        scanId: result.scan_id,
        date,
        risk: result.risk,
        confidence: result.confidence,
        message: result.message,
        demographics: demo,
        stopBang: stopBang || undefined,
        measurements: result.measurements,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  const notesDirty = notesText.trim() !== savedNotes;

  const handleSaveNotes = async () => {
    if (!user || !notesDirty) return;
    setNotesSaving(true);
    setNotesError(null);
    try {
      const notes = { text: notesText.trim(), authorName: user.displayName, authorUid: user.uid };
      await updateScanNotes(user.uid, result.scan_id, notes);
      setSavedNotes(notes.text);
      setNotesSavedMeta({ authorName: notes.authorName, updatedAt: Date.now() });
    } catch {
      setNotesError('Failed to save notes. Please try again.');
    } finally {
      setNotesSaving(false);
    }
  };

  const handleDownloadPLY = async () => {
    if (!result.faceMesh) return;
    setPlyLoading(true);
    try {
      const { generateFacePLY, downloadPLY } = await import('@/lib/ply');
      const ply = await generateFacePLY(
        result.faceMesh.landmarks,
        result.faceMesh.videoWidth,
        result.faceMesh.videoHeight,
        result.faceMesh.scaleMmPerPixel
      );
      downloadPLY(ply, `airscan-face-${result.scan_id}.ply`);
    } finally {
      setPlyLoading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'measurements', label: `Measurements ${result.measurements ? `(${result.measurements.length})` : ''}` },
    { key: '3d', label: '3D Model' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: 'clamp(16px, 4vw, 32px) clamp(16px, 4vw, 40px) 60px', overflow: 'auto' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="eyebrow">Report · {date}</div>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>ID {result.scan_id.slice(0, 8)}</span>
          </div>

          {/* Top strip: risk badge + action buttons */}
          <div className="results-top">
            <div className="card" style={{ padding: '22px 28px', display: 'flex', alignItems: 'center', gap: 22 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: c.ring, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontFamily: 'var(--font-serif)', fontSize: 22, textTransform: 'capitalize' }}>{result.risk[0]}</span>
              </div>
              <div>
                <div className="eyebrow" style={{ color: c.ink, marginBottom: 4 }}>{c.label}</div>
                <div className="serif" style={{ fontSize: 26, lineHeight: 1.1, color: 'var(--ink)' }}>{Math.round(result.confidence * 100)}% confidence</div>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '8px 0 0', lineHeight: 1.55 }}>{result.message}</p>
              </div>
            </div>
            <div className="results-actions">
              <button className="btn btn-primary" onClick={() => router.push('/history')}>
                <IconCheck size={14} /> Save to history
              </button>
              <button className="btn btn-secondary" onClick={handleDownloadPDF} disabled={pdfLoading}>
                <IconDownload size={14} /> {pdfLoading ? 'Generating…' : 'Download PDF'}
              </button>
              <button className="btn btn-secondary">
                <IconDocument size={14} /> Book consultation
              </button>
            </div>
          </div>

          {/* Doctor notes / ground truth — filled by clinician right after the scan */}
          {isAdmin && (
            <div className="card" style={{ padding: 20, marginTop: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>Doctor notes / ground truth</div>
              <textarea
                className="input-field"
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                placeholder="Add clinical notes or ground-truth assessment for this scan…"
                rows={3}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                  {notesError
                    ? <span style={{ color: 'var(--terra)' }}>{notesError}</span>
                    : notesSavedMeta
                      ? `Saved by ${notesSavedMeta.authorName} · ${formatDateTime(notesSavedMeta.updatedAt)}`
                      : 'No notes yet — also editable later from Admin › Users.'}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveNotes}
                  disabled={!notesDirty || notesSaving}
                  style={{ fontSize: 12, padding: '8px 16px', opacity: (!notesDirty || notesSaving) ? 0.6 : 1 }}>
                  {notesSaving ? 'Saving…' : 'Save notes'}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="results-tabs">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                padding: '11px 20px', fontSize: 13, fontWeight: 500, background: 'none', border: 'none',
                borderBottom: activeTab === t.key ? '2px solid var(--petrol)' : '2px solid transparent',
                color: activeTab === t.key ? 'var(--ink)' : 'var(--ink-3)',
                cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1,
                transition: 'color 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Summary ── */}
          {activeTab === 'summary' && (
            <div style={{ paddingTop: 20 }}>
              <div className="results-summary-grid">
                <div className="card" style={{ padding: 24 }}>
                  <div className="label" style={{ marginBottom: 12 }}>Craniofacial features</div>
                  {cranioRows.map(([name, val, flag, display]) => {
                    const fc = flag === 'high' ? 'var(--terra)' : flag === 'elevated' ? 'var(--amber)' : 'var(--sage)';
                    return (
                      <div key={String(name)} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: 'var(--ink-2)' }}>{String(name)}</span>
                          <span className="mono" style={{ color: 'var(--ink-3)' }}>{display ?? Number(val).toFixed(2)}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Number(val) * 100}%`, background: fc, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="card" style={{ padding: 24 }}>
                  <div className="label" style={{ marginBottom: 12 }}>
                    {patientType === 'paeds' ? 'PSQ & Demographic features' : 'Demographic features'}
                  </div>
                  {patientType === 'paeds' && psq ? (
                    <>
                      {/* PSQ score banner */}
                      <div style={{ padding: '12px 16px', marginBottom: 14, background: psq.positiveScreen ? 'var(--amber-bg)' : 'var(--sage-bg)', border: '1px solid ' + (psq.positiveScreen ? 'var(--amber)' : 'var(--sage)'), borderRadius: 'var(--r-md)', display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: psq.positiveScreen ? 'var(--amber-ink)' : 'var(--sage-ink)', marginBottom: 2 }}>PSQ Score</div>
                          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>{psq.score.toFixed(2)}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
                          {psq.numYes} Yes out of {psq.numAnswered} answered<br />
                          <span style={{ fontWeight: 600 }}>{psq.positiveScreen ? 'Positive screen ≥ 0.33' : 'Negative screen < 0.33'}</span>
                        </div>
                      </div>
                      {[
                        ['PSQ Score', psq.score],
                        ['BMI', Math.min(1, bmi / 30)],
                        ['Age group', Math.min(1, demo.age / 18)],
                        ['Sex factor', sexFactor],
                      ].map(([name, val]) => (
                        <div key={String(name)} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--ink-2)' }}>{String(name)}</span>
                            <span className="mono" style={{ color: 'var(--ink-3)' }}>{Number(val).toFixed(2)}</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Number(val) * 100}%`, background: 'var(--sage)', borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        ['BMI', Math.min(1, bmi / 40)],
                        ['Age group', Math.min(1, demo.age / 80)],
                        ['Sex factor', sexFactor],
                        ['Snoring indicator', stopBang?.snoring ? 0.95 : 0.05],
                      ].map(([name, val]) => (
                        <div key={String(name)} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ color: 'var(--ink-2)' }}>{String(name)}</span>
                            <span className="mono" style={{ color: 'var(--ink-3)' }}>{Number(val).toFixed(2)}</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--paper-2)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Number(val) * 100}%`, background: 'var(--petrol)', borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--paper-2)', borderRadius: 'var(--r-sm)', fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                    Values normalised 0–1. Flags are model-internal and not standalone diagnostic criteria.
                  </div>
                </div>
              </div>
              
              {/* Nasal Assessment */}
              {result.nasalAssessment && (
                <div className="card" style={{ padding: 24, marginTop: 16 }}>
                  <div className="label" style={{ marginBottom: 12 }}>Nasal assessment</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                    {[
                      ['Aperture Width', `${result.nasalAssessment.apertureWidthMm.toFixed(1)} mm`, result.nasalAssessment.flags.aperture],
                      ['Valve Angle (L)', `${result.nasalAssessment.valveAngleLeft.toFixed(1)}°`, result.nasalAssessment.valveAngleLeft < 10 ? 'high' : 'normal'],
                      ['Valve Angle (R)', `${result.nasalAssessment.valveAngleRight.toFixed(1)}°`, result.nasalAssessment.valveAngleRight < 10 ? 'high' : 'normal'],
                      ['Nostril Asymmetry', result.nasalAssessment.asymmetryRatio.toFixed(2), result.nasalAssessment.flags.asymmetry],
                    ].map(([name, val, flag]) => {
                      const fc = flag === 'high' ? 'var(--terra)' : flag === 'elevated' ? 'var(--amber)' : 'var(--sage)';
                      return (
                        <div key={String(name)} style={{ padding: 12, background: 'var(--paper-2)', borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 4 }}>{String(name)}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="mono" style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{String(val)}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4, background: `${fc}-bg`, color: fc }}>{String(flag)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* What this means */}
              <div className="card" style={{ padding: 20, marginTop: 16 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>Clinical interpretation</h3>
                <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                  {patientType === 'paeds' ? (
                    <>
                      {result.risk === 'green' && 'No significant markers of sleep-disordered breathing were detected. Continue routine paediatric check-ups and re-screen if symptoms develop.'}
                      {result.risk === 'yellow' && 'Moderate indicators of sleep-disordered breathing were detected. A follow-up consultation with a paediatrician or paediatric ENT specialist is recommended.'}
                      {result.risk === 'red' && 'Multiple strong risk markers for paediatric sleep-disordered breathing were detected. Prompt referral to a paediatric sleep specialist or ENT is strongly recommended.'}
                    </>
                  ) : (
                    <>
                      {result.risk === 'green' && 'No significant craniofacial markers associated with airway obstruction were detected. Continue routine oral health monitoring and re-screen annually.'}
                      {result.risk === 'yellow' && 'Several moderate risk indicators were detected. A follow-up consultation with a physician or ENT specialist is recommended within 4 weeks.'}
                      {result.risk === 'red' && 'Multiple strong risk indicators were detected. You are advised to seek evaluation from a qualified medical practitioner promptly. Polysomnography (sleep study) is strongly recommended.'}
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ── Tab: Measurements ── */}
          {activeTab === 'measurements' && (
            <div style={{ paddingTop: 20 }}>
              {result.measurements && result.measurements.length > 0 ? (
                <>
                  <div className="card results-measure-wrap" style={{ overflow: 'hidden' }}>
                    <div className="results-measure-min">
                      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.8fr 0.6fr', padding: '12px 20px', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)' }}>
                        <div>Measurement</div><div>Value</div><div>Normal range</div><div>Flag</div>
                      </div>
                      {result.measurements.map((m, i) => (
                        <div key={m.name} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 0.8fr 0.6fr', padding: '14px 20px', alignItems: 'center', borderBottom: i < result.measurements!.length - 1 ? '1px solid var(--line-2)' : 'none' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.4 }}>{m.significance}</div>
                          </div>
                          <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: FLAG_COLOR[m.flag] }}>
                            {m.valueMm}{m.unit ?? ' mm'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{m.norm} mm</div>
                          <div>
                            <span style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize', background: m.flag === 'high' ? 'var(--terra-bg)' : m.flag === 'elevated' ? 'var(--amber-bg)' : 'var(--sage-bg)', color: FLAG_COLOR[m.flag] }}>
                              {m.flag}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card" style={{ padding: 16, marginTop: 12, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--ink-2)' }}>Clinical note:</strong> Bigonial/bizygomatic ratio &lt;0.68 and lower face ratio &gt;0.60 are established OSA structural predictors. Mandibular length is the strongest single anatomical predictor.
                  </div>
                </>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-3)' }}>
                  No measurement data available for this scan.
                </div>
              )}
            </div>
          )}

          {/* ── Tab: 3D Model ── */}
          {activeTab === '3d' && (
            <div style={{ paddingTop: 20 }}>
              <div className="card" style={{ padding: 20 }}>
                <ThreeDModel />
              </div>
              {result.faceMesh && (
                <div className="card" style={{ padding: 16, marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div className="label" style={{ marginBottom: 4 }}>Export your scan</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Download a 3D mesh (.ply) built from your front-angle scan — open it in MeshLab, Blender, or similar.</div>
                  </div>
                  <button className="btn btn-secondary" onClick={handleDownloadPLY} disabled={plyLoading} style={{ flexShrink: 0 }}>
                    {plyLoading ? 'Generating…' : 'Export 3D Model (.ply)'}
                  </button>
                </div>
              )}
              <div className="card" style={{ padding: 16, marginTop: 12 }}>
                <div className="label" style={{ marginBottom: 10 }}>Landmark index</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
                  {['Cranial', 'Airway', 'Jaw', 'Oral', 'Facial', 'Orbital'].map(group => {
                    const groupColors: Record<string, string> = { Cranial: '#00c9a7', Airway: '#ffa94d', Jaw: '#ff5c5c', Oral: '#60a5fa', Facial: '#c084fc', Orbital: '#60a5fa' };
                    return (
                      <div key={group} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: groupColors[group], display: 'inline-block', flexShrink: 0 }} />
                        {group}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}><Disclaimer /></div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-ghost" onClick={() => router.push('/history')}>
              <IconHistory size={14} /> View past scans
            </button>
            <span style={{ flex: 1 }} />
            <button className="btn btn-secondary" onClick={() => router.push('/scan')}>
              Start another scan
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
