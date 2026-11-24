/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { loadFactApplications } from '../../data/loader';
import { FactApplicationRecord } from '../../types';
import { BaseEChart } from './BaseEChart';
import { Alert, RankBadge } from '../common/UIPrimitives';
import {
  CANONICAL_SINTA_RANKS,
  formatSintaRankLabel,
  getSintaRankTooltipDescription,
  createCategoricalAxisLabelConfig,
  createCategoricalGridConfig,
} from '../../lib/chartAxisConfig';
import * as echarts from '../../lib/echarts';

export interface CohortRow {
  rank: string;
  submitted: number;
  rejected: number;
  notRejected: number;
  rejectionRate: number;
}

/** Submission-cohort aggregation: applications submitted in [from, to], and how many of them were rejected. */
export function aggregateApplicationCohort(
  records: FactApplicationRecord[],
  from: string,
  to: string,
  mode: 'strict' | 'extended',
): CohortRow[] {
  const counts = new Map<string, { submitted: number; rejected: number }>();
  for (const rec of records) {
    const day = rec.submitted_day;
    if (!day || day < from || day > to) continue;
    const rank = mode === 'extended' ? rec.extended_sinta_rank : rec.sinta_rank;
    const c = counts.get(rank) ?? { submitted: 0, rejected: 0 };
    c.submitted += 1;
    if (rec.outcome === 'rejected') c.rejected += 1;
    counts.set(rank, c);
  }
  return CANONICAL_SINTA_RANKS.filter((rank) => counts.has(rank)).map((rank) => {
    const { submitted, rejected } = counts.get(rank)!;
    return {
      rank,
      submitted,
      rejected,
      notRejected: submitted - rejected,
      rejectionRate: submitted ? (rejected / submitted) * 100 : 0,
    };
  });
}

const MIN_DAY = '2022-01-01';
const MAX_DAY = '2026-11-23';

const cellStyle: React.CSSProperties = { padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' };

export const ApplicationsCohortSection: React.FC<{ defaultMode?: 'strict' | 'extended' }> = ({ defaultMode = 'strict' }) => {
  const [records, setRecords] = useState<FactApplicationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(MIN_DAY);
  const [to, setTo] = useState(MAX_DAY);
  const [mode, setMode] = useState<'strict' | 'extended'>(defaultMode);

  useEffect(() => {
    loadFactApplications()
      .then(setRecords)
      .catch((err) => setError(err.message || 'Failed to load applications dataset'));
  }, []);

  const rows = useMemo(() => aggregateApplicationCohort(records, from, to, mode), [records, from, to, mode]);
  const totals = useMemo(() => {
    const submitted = rows.reduce((a, r) => a + r.submitted, 0);
    const rejected = rows.reduce((a, r) => a + r.rejected, 0);
    return { submitted, rejected, rate: submitted ? (rejected / submitted) * 100 : 0 };
  }, [rows]);

  const options: echarts.EChartsOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return '';
        const row = rows[params[0].dataIndex];
        let s = `<div style="font-weight:700;">${getSintaRankTooltipDescription(row.rank)}</div>`;
        params.forEach((p: any) => {
          const value = p.seriesName === 'Rejection Rate' ? `${Number(p.value).toFixed(1)}%` : Number(p.value).toLocaleString();
          s += `<div style="font-size:12px;display:flex;justify-content:space-between;gap:12px;">
            <span>${p.marker} ${p.seriesName}</span>
            <span style="font-family:var(--font-mono);font-weight:600;">${value}</span>
          </div>`;
        });
        return s;
      },
    },
    legend: {
      data: ['New Applications', 'Rejected', 'Rejection Rate'],
      bottom: 0,
      textStyle: { fontFamily: 'var(--font-sans)', fontSize: 12 },
    },
    grid: createCategoricalGridConfig({ left: '4%', right: '6%', top: '12%', bottom: '16%' }),
    xAxis: {
      type: 'category',
      data: rows.map((r) => formatSintaRankLabel(r.rank)),
      axisLabel: createCategoricalAxisLabelConfig({ rotate: 0, fontSize: 11 }),
    },
    yAxis: [
      { type: 'value', name: 'Applications', axisLabel: { fontFamily: 'var(--font-mono)' } },
      { type: 'value', name: 'Rejection %', min: 0, max: 100, axisLabel: { fontFamily: 'var(--font-mono)', formatter: '{value}%' } },
    ],
    series: [
      {
        name: 'New Applications',
        type: 'bar',
        data: rows.map((r) => r.submitted),
        itemStyle: { color: '#1F3A5F' },
        label: { show: true, position: 'top', fontFamily: 'var(--font-mono)', fontSize: 10 },
      },
      {
        name: 'Rejected',
        type: 'bar',
        data: rows.map((r) => r.rejected),
        itemStyle: { color: '#982E0A' },
        label: { show: true, position: 'top', fontFamily: 'var(--font-mono)', fontSize: 10 },
      },
      {
        name: 'Rejection Rate',
        type: 'line',
        yAxisIndex: 1,
        data: rows.map((r) => Number(r.rejectionRate.toFixed(1))),
        itemStyle: { color: '#3A5959' },
        symbolSize: 7,
      },
    ],
  }), [rows]);

  const downloadCsv = () => {
    const header = ['SINTA Rank (as-of 2026-11-15)', 'New Applications', 'Rejected', 'Not Rejected', 'Rejection Rate %'];
    const lines = rows.map((r) => [r.rank, r.submitted, r.rejected, r.notRejected, r.rejectionRate.toFixed(1)].join(','));
    const meta = `# Submission window ${from} to ${to}; matching ${mode}`;
    const blob = new Blob([[meta, header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `doaj_applications_by_sinta_${from}_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (error) return <Alert type="warning" title="Applications data unavailable">{error}</Alert>;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{
          padding: 'var(--space-3) var(--space-4)',
          backgroundColor: 'var(--light-grey)',
          borderBottom: '1px solid var(--neutral-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
        }}
      >
        <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>New Applications vs Rejected by SINTA Level</h3>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap', fontSize: 'var(--text-sm)' }}>
          <label>
            Submitted from{' '}
            <input type="date" aria-label="Submitted from" value={from} min={MIN_DAY} max={to} onChange={(e) => setFrom(e.target.value || MIN_DAY)} />
          </label>
          <label>
            to{' '}
            <input type="date" aria-label="Submitted to" value={to} min={from} max={MAX_DAY} onChange={(e) => setTo(e.target.value || MAX_DAY)} />
          </label>
          <select aria-label="Matching mode" value={mode} onChange={(e) => setMode(e.target.value as 'strict' | 'extended')}>
            <option value="strict">Strict matching</option>
            <option value="extended">Extended matching</option>
          </select>
          <button type="button" className="btn btn-secondary" style={{ minHeight: '30px', fontSize: 'var(--text-xs)' }} onClick={downloadCsv}>
            Download CSV
          </button>
        </div>
      </div>

      <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Alert type="note" title="Submission cohort">
          Counts applications submitted between {from} and {to} (DOAJ application export, 24 November 2026), and how many of
          those applications have been rejected so far. "Not rejected" means accepted; this export contains no pending applications.
          Recent cohorts may still change. SINTA levels reflect the 15 November 2026 snapshot, not the level at submission time.
        </Alert>

        <BaseEChart
          title="New Applications, Rejections and Rejection Rate by SINTA Level"
          metricLabel="Application Volume"
          unit="applications"
          denominatorNote={`Applications submitted ${from} to ${to}: ${totals.submitted.toLocaleString()}`}
          scopeNote={`Rejected: ${totals.rejected.toLocaleString()} (${totals.rate.toFixed(1)}%)`}
          options={options}
          height={360}
          snapshotDate="24 November 2026"
          ariaLabel="Grouped bar chart of new DOAJ applications and rejected applications per SINTA level with rejection rate line"
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--neutral-border)' }}>
                <th style={{ padding: 'var(--space-3)' }}>SINTA Level</th>
                <th style={{ ...cellStyle, fontFamily: undefined }}>New Applications</th>
                <th style={{ ...cellStyle, fontFamily: undefined }}>Rejected</th>
                <th style={{ ...cellStyle, fontFamily: undefined }}>Not Rejected</th>
                <th style={{ ...cellStyle, fontFamily: undefined }}>Rejection Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.rank} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <RankBadge rank={r.rank} />
                    <span style={{ marginLeft: 'var(--space-2)', fontWeight: 600 }}>{formatSintaRankLabel(r.rank)}</span>
                  </td>
                  <td style={cellStyle}>{r.submitted.toLocaleString()}</td>
                  <td style={{ ...cellStyle, color: 'var(--sanguine)', fontWeight: 600 }}>{r.rejected.toLocaleString()}</td>
                  <td style={cellStyle}>{r.notRejected.toLocaleString()}</td>
                  <td style={cellStyle}>{r.rejectionRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--warm-black-05)', fontWeight: 700, borderTop: '2px solid var(--neutral-border)' }}>
                <td style={{ padding: 'var(--space-3)' }}>Total</td>
                <td style={cellStyle}>{totals.submitted.toLocaleString()}</td>
                <td style={{ ...cellStyle, color: 'var(--sanguine)' }}>{totals.rejected.toLocaleString()}</td>
                <td style={cellStyle}>{(totals.submitted - totals.rejected).toLocaleString()}</td>
                <td style={cellStyle}>{totals.rate.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
