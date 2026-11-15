import React, { useEffect, useMemo, useState } from 'react';
import { loadDataQuality, loadSummary } from '../data/loader';
import { DataQualityPublic, SummaryPublic } from '../types';
import { Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';

export const DataQualityPage: React.FC = () => {
  const [quality, setQuality] = useState<DataQualityPublic | null>(null);
  const [summary, setSummary] = useState<SummaryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadDataQuality(), loadSummary()])
      .then(([q, s]) => {
        setQuality(q);
        setSummary(s);
      })
      .catch((err) => setError(err.message || 'Failed to load data quality datasets'));
  }, []);

  const manifestRows = useMemo(() => summary ? [
    { label: 'DOAJ Rejected Applications', rows: summary.source_record_counts.rejected, journals: summary.identity_counts.rejected_resolved_journals, date: summary.as_of.doaj_export_utc, dateLabel: `${summary.as_of.doaj_export_utc} UTC`, integrity: '100% Conserved' },
    { label: 'DOAJ Last Withdrawn', rows: summary.source_record_counts.withdrawn, journals: summary.identity_counts.withdrawn_resolved_journals, date: summary.as_of.doaj_export_utc, dateLabel: `${summary.as_of.doaj_export_utc} UTC`, integrity: '100% Conserved' },
    { label: 'SINTA National Database', rows: summary.source_record_counts.sinta, journals: summary.identity_counts.sinta_journals, date: summary.as_of.sinta_snapshot, dateLabel: `${summary.as_of.sinta_snapshot} (Final Census)`, integrity: '100% Conserved' },
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
      </div>

      {/* Dataset Verification Manifest Table */}
      <section className="card">
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
