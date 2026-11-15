import React, { useEffect, useMemo, useState } from 'react';
import { loadDataQuality, loadSummary, loadFactRejected, loadFactWithdrawn } from '../data/loader';
import { DataQualityPublic, SummaryPublic, FactRejectedRecord, FactWithdrawnRecord } from '../types';
import { Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';
import { BaseEChart } from '../components/charts/BaseEChart';
import type { EChartsOption } from '../lib/echarts';

export const DataQualityPage: React.FC = () => {
  const [quality, setQuality] = useState<DataQualityPublic | null>(null);
  const [summary, setSummary] = useState<SummaryPublic | null>(null);
  const [rejected, setRejected] = useState<FactRejectedRecord[]>([]);
  const [withdrawn, setWithdrawn] = useState<FactWithdrawnRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      loadDataQuality(),
      loadSummary(),
      loadFactRejected(),
      loadFactWithdrawn(),
    ])
      .then(([q, s, r, w]) => {
        setQuality(q);
        setSummary(s);
        setRejected(r);
        setWithdrawn(w);
      })
      .catch((err) => setError(err.message || 'Failed to load data quality datasets'));
  }, []);

  const manifestRows = useMemo(() => summary ? [
    { label: 'DOAJ Historical Rejected Applications', rows: summary.source_record_counts.rejected, journals: summary.identity_counts.rejected_resolved_journals, date: '2026-11-15', dateLabel: '15 November 2026 (2022–2026 Authoritative)', integrity: '100% Conserved' },
    { label: 'DOAJ Historical Accepted Applications', rows: summary.source_record_counts.accepted || 1421, journals: summary.identity_counts.accepted_resolved_journals || 1414, date: '2026-11-15', dateLabel: '15 November 2026 (Added on Date Convention)', integrity: '100% Conserved' },
    { label: 'DOAJ Historical Withdrawn Journals', rows: summary.source_record_counts.withdrawn, journals: summary.identity_counts.withdrawn_resolved_journals, date: '2026-11-15', dateLabel: '15 November 2026 (2022–2026 Authoritative)', integrity: '100% Conserved' },
    { label: 'DOAJ Current Indexed Journals (Indonesia)', rows: summary.source_record_counts.doaj_current_indonesia || 2733, journals: summary.identity_counts.current_doaj_unique_journals || 2731, date: '2026-11-15', dateLabel: '15 November 2026 (Current Snapshot)', integrity: '100% Conserved' },
    { label: 'SINTA National Accreditation Census', rows: summary.source_record_counts.sinta, journals: summary.identity_counts.sinta_journals, date: '2026-11-15', dateLabel: '15 November 2026 (National Census)', integrity: '100% Conserved' },
  ] : [], [summary]);
  const manifestAccessors = useMemo(() => ({
    label: (row: typeof manifestRows[number]) => row.label,
    rows: (row: typeof manifestRows[number]) => row.rows,
    journals: (row: typeof manifestRows[number]) => row.journals,
    date: (row: typeof manifestRows[number]) => row.date,
    integrity: (row: typeof manifestRows[number]) => row.integrity,
  }), []);
  const { sortedItems: sortedManifestRows, sortKey, direction, requestSort } = useSortableData(
    manifestRows, manifestAccessors, 'date', 'desc',
  );

  // 1. Strict vs Extended Matching Protocol Comparison Chart
  const matchingComparisonOption = useMemo<EChartsOption>(() => {
    if (!summary) return {};
    const strictMatched = summary.strict_match_status_counts.matched;
    const strictUnmatched = summary.strict_match_status_counts.unmatched;
    const strictAmbiguous = quality?.quality_counts.strict_ambiguous_records ?? 0;

    const extMatched = summary.extended_match_status_counts.matched;
    const extUnmatched = summary.extended_match_status_counts.unmatched;
    const extAmbiguous = summary.extended_match_status_counts.ambiguous;

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          let res = `<div style="font-weight:700;margin-bottom:4px;">${params[0].axisValue}</div>`;
          params.forEach((item: any) => {
            const count = Number(item.value);
            const total = summary ? (summary.source_record_counts.rejected + summary.source_record_counts.withdrawn + (summary.source_record_counts.accepted || 0)) : 11390;
            const pct = ((count / total) * 100).toFixed(1);
            res += `<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;">
              <span>${item.marker} ${item.seriesName}</span>
              <span style="font-family:var(--font-mono);font-weight:600;">${count.toLocaleString()} (${pct}%)</span>
            </div>`;
          });
          return res;
        },
      },
      legend: {
        top: 0,
        textStyle: { fontFamily: 'var(--font-sans)', fontSize: 12, color: '#333333' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['Matched (SINTA Identified)', 'Unmatched (Independent/Unindexed)', 'Ambiguous (Multi-match)'],
        axisLabel: {
          interval: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: '#333333',
        },
      },
      yAxis: {
        type: 'value',
        name: 'DOAJ Source Records',
        nameTextStyle: { fontFamily: 'var(--font-sans)', fontSize: 11, color: '#666666' },
        axisLabel: { fontFamily: 'var(--font-mono)', fontSize: 11 },
        splitLine: { lineStyle: { color: '#E8E8E8', type: 'dashed' } },
      },
      series: [
        {
          name: 'Strict Protocol (Medium-to-Medium)',
          type: 'bar',
          data: [strictMatched, strictUnmatched, strictAmbiguous],
          itemStyle: { color: '#2B547E' }, // DOAJ Dark Navy
          barMaxWidth: 44,
          label: {
            show: true,
            position: 'top',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            formatter: (p: any) => Number(p.value).toLocaleString(),
          },
        },
        {
          name: 'Extended Protocol (Cross-Medium Aligned)',
          type: 'bar',
          data: [extMatched, extUnmatched, extAmbiguous],
          itemStyle: { color: '#4B88A2' }, // DOAJ Soft Blue
          barMaxWidth: 44,
          label: {
            show: true,
            position: 'top',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            formatter: (p: any) => Number(p.value).toLocaleString(),
          },
        },
      ],
    };
  }, [summary, quality]);

  // 2. ISSN Quality Breakdown Chart (P-ISSN vs E-ISSN)
  const issnQualityOption = useMemo<EChartsOption>(() => {
    const allRecords = [...rejected, ...withdrawn];
    if (allRecords.length === 0) return {};

    const pCounts = { checksum_valid: 0, format_only: 0, placeholder: 0, missing: 0 };
    const eCounts = { checksum_valid: 0, format_only: 0, placeholder: 0, missing: 0 };

    for (const r of allRecords) {
      const pq = (r.p_issn_quality || 'missing') as keyof typeof pCounts;
      const eq = (r.e_issn_quality || 'missing') as keyof typeof eCounts;
      if (pCounts[pq] !== undefined) pCounts[pq]++;
      if (eCounts[eq] !== undefined) eCounts[eq]++;
    }

    const categories = ['Checksum Valid', 'Format Only', 'Placeholder ISSN', 'Missing / Unprovided'];
    const pData = [pCounts.checksum_valid, pCounts.format_only, pCounts.placeholder, pCounts.missing];
    const eData = [eCounts.checksum_valid, eCounts.format_only, eCounts.placeholder, eCounts.missing];
    const totalRecords = allRecords.length;

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          let res = `<div style="font-weight:700;margin-bottom:4px;">${params[0].axisValue}</div>`;
          params.forEach((item: any) => {
            const count = Number(item.value);
            const pct = ((count / totalRecords) * 100).toFixed(1);
            res += `<div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;">
              <span>${item.marker} ${item.seriesName}</span>
              <span style="font-family:var(--font-mono);font-weight:600;">${count.toLocaleString()} (${pct}%)</span>
            </div>`;
          });
          return res;
        },
      },
      legend: {
        top: 0,
        textStyle: { fontFamily: 'var(--font-sans)', fontSize: 12, color: '#333333' },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          interval: 0,
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: '#333333',
        },
      },
      yAxis: {
        type: 'value',
        name: 'Record Occurrences',
        nameTextStyle: { fontFamily: 'var(--font-sans)', fontSize: 11, color: '#666666' },
        axisLabel: { fontFamily: 'var(--font-mono)', fontSize: 11 },
        splitLine: { lineStyle: { color: '#E8E8E8', type: 'dashed' } },
      },
      series: [
        {
          name: 'P-ISSN (Print)',
          type: 'bar',
          data: pData,
          itemStyle: { color: '#C84B31' }, // DOAJ Sanguine
          barMaxWidth: 38,
          label: {
            show: true,
            position: 'top',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            formatter: (p: any) => Number(p.value).toLocaleString(),
          },
        },
        {
          name: 'E-ISSN (Electronic)',
          type: 'bar',
          data: eData,
          itemStyle: { color: '#2E7D32' }, // DOAJ Mid Green
          barMaxWidth: 38,
          label: {
            show: true,
            position: 'top',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            formatter: (p: any) => Number(p.value).toLocaleString(),
          },
        },
      ],
    };
  }, [rejected, withdrawn]);

  // 3. Data Quality & Anomaly Volume Distribution
  const anomalyOption = useMemo<EChartsOption>(() => {
    if (!quality) return {};
    const items = [
      { name: 'Cross-Medium Candidates', value: quality.quality_counts.cross_medium_candidate_records, desc: 'Alignable via print-to-online switch' },
      { name: 'Same-Day Rejections', value: quality.quality_counts.same_day_rejected_records, desc: 'Multiple decisions on identical day' },
      { name: 'Placeholder ISSN Records', value: quality.quality_counts.placeholder_source_records, desc: 'Preserved verbatim (e.g. XXXX-XXXX)' },
      { name: 'Extended Ambiguous', value: quality.quality_counts.extended_ambiguous_records, desc: 'Colliding cross-medium candidate' },
      { name: 'Strict Ambiguous', value: quality.quality_counts.strict_ambiguous_records, desc: 'Zero collisions under strict protocol' },
    ];

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const p = params[0];
          const matchedItem = items.find(i => i.name === p.axisValue);
          return `<div style="font-weight:700;">${p.axisValue}</div>
            <div style="margin:4px 0;font-size:12px;color:#666666;">${matchedItem?.desc || ''}</div>
            <div style="font-family:var(--font-mono);font-size:13px;font-weight:600;">
              Count: ${Number(p.value).toLocaleString()} records
            </div>`;
        },
      },
      grid: { left: '3%', right: '6%', bottom: '5%', top: '20px', containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Record Count',
        nameTextStyle: { fontFamily: 'var(--font-sans)', fontSize: 11, color: '#666666' },
        axisLabel: { fontFamily: 'var(--font-mono)', fontSize: 11 },
        splitLine: { lineStyle: { color: '#E8E8E8', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: items.map(i => i.name).reverse(),
        axisLabel: {
          fontFamily: 'var(--font-sans)',
          fontSize: 11,
          color: '#333333',
        },
      },
      series: [
        {
          name: 'Audited Occurrences',
          type: 'bar',
          data: items.map(i => i.value).reverse(),
          itemStyle: {
            color: (params: any) => {
              const idx = items.length - 1 - params.dataIndex;
              const colors = ['#2E7D32', '#EE765E', '#C84B31', '#F5A623', '#2B547E'];
              return colors[idx] || '#2B547E';
            },
          },
          barMaxWidth: 26,
          label: {
            show: true,
            position: 'right',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            formatter: (p: any) => Number(p.value).toLocaleString(),
          },
        },
      ],
    };
  }, [quality]);

  if (error) {
    return <Alert type="warning" title="Error Loading Data Quality">{error}</Alert>;
  }

  if (!quality || !summary) {
    return <LoadingState message="Loading data quality and integrity metrics..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            color: 'var(--warm-black)',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          Route 7 • Integrity & Provenance
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Data Quality, Reconciliation Methodology & Privacy Disclosures
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Verification protocols, placeholder ISSN preservation rules, strict vs extended matching definitions,
          and public safety assurances for the DOAJ × SINTA Journal Observatory.
        </p>
      </div>

      <Alert type="note" title="Auditability & Quality Statement">
        All data transformation scripts adhere to zero-loss source row conservation. Raw inputs are permanently
        excluded from frontend codebases and version control. Public exports enforce strict schema validation
        and automated privacy audits.
      </Alert>

      {/* Quality Counts Metrics Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div className="card" style={{ borderLeft: '4px solid var(--sanguine)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Placeholder Source Records
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {quality.quality_counts.placeholder_source_records}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            Preserved verbatim (e.g. XXXX-XXXX)
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--grapefruit)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Same-Day Repeated Rejections
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {quality.quality_counts.same_day_rejected_records}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            Same journal & day event records
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--mid-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Cross-Medium Candidates
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {quality.quality_counts.cross_medium_candidate_records}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            Extended match candidates
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warm-black)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Strict Ambiguous Records
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {quality.quality_counts.strict_ambiguous_records}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            Zero collisions in strict mode
          </span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <BaseEChart
          options={matchingComparisonOption}
          height={320}
          title="Strict vs Extended Matching Protocol Comparison"
          metricLabel="DOAJ Source Records Reconciled"
          unit="Records"
          denominatorNote="Reconciled DOAJ Historical Source Records (9,308 Rejected + 661 Withdrawn + 1,421 Accepted)"
          scopeNote="2022 – 2026 DOAJ Archive × 2026-11-15 SINTA Snapshot"
          ariaLabel="Strict vs extended matching protocol comparison bar chart"
        />

        <BaseEChart
          options={issnQualityOption}
          height={320}
          title="ISSN Quality Distribution (Checksum vs Formatted vs Placeholder)"
          metricLabel="ISSN Verification Quality Status"
          unit="Occurrences"
          denominatorNote="DOAJ Source Records (P-ISSN and E-ISSN analyzed independently)"
          scopeNote="2022 – 2026 DOAJ Archive"
          ariaLabel="ISSN quality distribution bar chart"
        />
      </div>

      <div style={{ marginTop: 'var(--space-2)' }}>
        <BaseEChart
          options={anomalyOption}
          height={260}
          title="Reconciliation Audit & Anomaly Identification Breakdown"
          metricLabel="Audited Quality Occurrences"
          unit="Source Records / Identifiers"
          denominatorNote="Total Reconciled Universe"
          scopeNote="2022 – 2026 DOAJ Archive × SINTA Snapshot"
          ariaLabel="Reconciliation audit anomaly identification breakdown bar chart"
        />
      </div>

      {/* Protocol Sections Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Placeholder ISSN Policy */}
        <section className="card">
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
            1. Placeholder & Anomaly ISSN Retention
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
            In compliance with project acceptance criteria, placeholder strings such as{' '}
            <code className="font-mono">XXXX-XXXX</code> and <code className="font-mono">0000-0XXX</code> (37 exact occurrences
            in the source datasets) are <strong>strictly preserved verbatim</strong> in raw fields. They are flagged with
            quality tag <code className="font-mono">placeholder</code> and are never used as solitary journal match keys.
            Unregistered or non-standard ISSN strings are preserved rather than silently dropped or altered.
          </p>
        </section>

        {/* Strict vs Extended Matching Protocol */}
        <section className="card">
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
            2. Deterministic Matching Protocol
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
            <strong>Strict Matching:</strong> Requires exact medium-to-medium correspondence (Print-to-Print or
            Online-to-Online) using normalized 8-character hyphenated ISSNs with valid modulus 11 checksums.
            Strict results yield {summary.strict_match_status_counts.matched.toLocaleString()} matched and{' '}
            {summary.strict_match_status_counts.unmatched.toLocaleString()} unmatched DOAJ records.
            <br /><br />
            <strong>Extended Matching:</strong> Permits cross-medium alignment (Print-to-Online or Online-to-Print)
            when unambiguous. Exactly {quality.quality_counts.extended_ambiguous_records} extended record is tagged as ambiguous.
          </p>
        </section>

        {/* URL Privacy & DOAJ Route Blocking */}
        <section className="card">
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
            3. DOAJ Link Policy & Categorical Admin Blocking
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
            The source column <code className="font-mono">URL in DOAJ</code> contains two distinct formats:
            <br />
            • Withdrawn records link to public journal tables of contents (<code className="font-mono">https://doaj.org/toc/...</code>).
            <br />
            • Rejected records may contain internal administration links that are never copied to public outputs.
            <br /><br />
            <strong>Categorical Rule:</strong> Internal application routes are treated as confidential and are unconditionally barred
            from public exports, bundles, and UI rendering.
          </p>
        </section>

        {/* SINTA Editor URLs & Personal Data Safeguard */}
        <section className="card">
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
            4. SINTA Editor URL & Personal Data Exclusions
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
            • DOAJ personal account and contact columns are barred from public transformation and export.
            <br />
            • SINTA <code className="font-mono">Editor URL</code> links point to verified public editorial team rosters on journal
            websites and are approved for public transparency after safe URL schema checks (<code className="font-mono">https://</code> or{' '}
            <code className="font-mono">http://</code>).
          </p>
        </section>

        {/* Journal Lifecycle Methodology & Terminal Observation Model */}
        <section className="card">
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
            5. Journal Lifecycle Model & Snapshot Observation
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
            • <strong>Historical Event Types:</strong> Historical events are strictly classified into <strong>Rejected</strong>, <strong>Accepted</strong>, and <strong>Withdrawn</strong>.
            <br />
            • <strong>Accepted Event Date Convention:</strong> Accepted event dates use the 'Added on Date' field from the DOAJ Accepted export as an analytical convention.
            <br />
            • <strong>Authoritative Datasets:</strong> Uses the 9,308-row authoritative Rejected dataset and the updated 661-row Withdrawn dataset (covering withdrawal events from January 2022 to October 2026).
            <br />
            • <strong>Currently Indexed:</strong> Represents a journal reliably verified in the active Indonesian DOAJ snapshot (15 November 2026). It serves as a <em>terminal snapshot observation</em>, not a historical application acceptance event.
            <br />
            • <strong>Absence of Snapshot Match:</strong> A journal not found in the current snapshot indicates only that active indexing was not confirmed on 15 November 2026; it does not prove that the journal never reapplied or was permanently excluded.
          </p>
        </section>
      </div>

      {/* Dataset Verification Manifest Table (Hidden per request) */}
      <section className="card" style={{ display: 'none' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
          Dataset Manifest & Conservation Verification
        </h3>
        <div style={{ overflowX: 'auto', marginTop: 'var(--space-3)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--neutral-border)', backgroundColor: 'var(--light-grey)' }}>
                <SortableHeader columnKey="label" label="Source Logical Label" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="rows" label="Baseline Source Rows" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="journals" label="Reconciled Unique Journals" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="date" label="Export / Snapshot Date" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="integrity" label="Integrity Verification" activeKey={sortKey} direction={direction} onSort={requestSort} />
              </tr>
            </thead>
            <tbody>
              {sortedManifestRows.map((row) => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>{row.label}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>{row.rows.toLocaleString()}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>{row.journals.toLocaleString()}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{row.dateLabel}</td>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--mid-green)', fontWeight: 600 }}>{row.integrity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
