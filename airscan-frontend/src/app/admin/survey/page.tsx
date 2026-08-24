'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui/TopBar';
import { Disclaimer } from '@/components/ui/Disclaimer';
import { IconArrowLeft, IconDownload } from '@/components/ui/Icons';
import { StatCard } from '@/components/admin/StatCard';
import { getAdminSurveyData } from '@/lib/surveyApi';
import type { AdminSurveyData, AdminSurveyResponseRow } from '@/lib/surveyApi';
import { AIRSCAN_SURVEY_SCHEMA } from '@/lib/surveySchema';

function formatDateTime(ms: number | null) {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildResponsesCsv(responses: AdminSurveyResponseRow[]): string {
  const questionIds = AIRSCAN_SURVEY_SCHEMA.sections.flatMap(s => s.questions.map(q => q.id));
  const headers = ['uid', 'email', 'displayName', 'submittedAt', 'pinIndex', ...questionIds];

  const rows = responses.map(r => {
    const base = [
      r.uid,
      r.email ?? '',
      r.displayName ?? '',
      r.submittedAt ? new Date(r.submittedAt).toISOString() : '',
      String(r.pinIndex),
    ];
    const answerCells = questionIds.map(qid => {
      const value = r.answers?.[qid];
      if (Array.isArray(value)) return value.join('; ');
      if (value === undefined || value === null) return '';
      return String(value);
    });
    return [...base, ...answerCells].map(csvCell).join(',');
  });

  // Leading BOM so Excel opens the UTF-8 file correctly instead of mangling accented text.
  return '﻿' + [headers.map(csvCell).join(','), ...rows].join('\n');
}

function downloadResponsesCsv(responses: AdminSurveyResponseRow[]) {
  const csv = buildResponsesCsv(responses);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `airscan-survey-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminSurveyPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminSurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminSurveyData()
      .then(d => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setError('Failed to load survey data.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const claimed = data ? data.pinsTotal - data.pinsRemaining : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      <TopBar />
      <div style={{ padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 40px) 60px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <button className="btn btn-ghost" onClick={() => router.push('/admin')} style={{ marginBottom: 16, paddingLeft: 0 }}>
            <IconArrowLeft size={16} /> Admin
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Admin</div>
              <h1 className="serif" style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', margin: 0, letterSpacing: '-0.01em', color: 'var(--ink)' }}>
                Survey responses
              </h1>
            </div>
            <button
              className="btn btn-secondary"
              disabled={!data || data.responses.length === 0}
              onClick={() => data && downloadResponsesCsv(data.responses)}
              style={{ gap: 6 }}>
              <IconDownload size={16} /> Export CSV
            </button>
          </div>

          {error && (
            <div className="card" style={{ padding: 20, marginBottom: 16, background: 'var(--terra-bg)', border: '1px solid var(--terra)', color: 'var(--terra-ink)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}><StatCard label="PINs Remaining" value={loading ? '…' : data?.pinsRemaining ?? 0} /></div>
            <div style={{ flex: '1 1 180px' }}><StatCard label="PINs Claimed" value={loading ? '…' : claimed} /></div>
            <div style={{ flex: '1 1 180px' }}><StatCard label="Total PINs" value={loading ? '…' : data?.pinsTotal ?? 0} /></div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr 1.4fr 0.6fr', padding: '12px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-3)', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontWeight: 500 }}>
              <div>Name</div><div>Email</div><div>Submitted</div><div>PIN #</div>
            </div>

            {loading && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
            )}
            {!loading && (data?.responses.length ?? 0) === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>No responses yet.</div>
            )}
            {data?.responses.map(r => (
              <div key={r.uid} style={{ display: 'grid', gridTemplateColumns: '1.8fr 2fr 1.4fr 0.6fr', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid var(--line-2)' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{r.displayName ?? '—'}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{r.email ?? '—'}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{formatDateTime(r.submittedAt)}</div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--ink)' }}>#{r.pinIndex}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}><Disclaimer /></div>
        </div>
      </div>
    </div>
  );
}
