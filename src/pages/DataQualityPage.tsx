import React from 'react';
import { Alert } from '../components/common/UIPrimitives';

export const DataQualityPage: React.FC = () => {
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

      <Alert type="note" title="Auditability Statement">
        All data transformation scripts adhere to zero-loss source row conservation. Raw inputs are permanently
        excluded from frontend codebases and version control. Public exports enforce strict schema validation
        and automated privacy audits.
      </Alert>

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
            <br /><br />
            <strong>Extended Matching:</strong> Permits cross-medium alignment (Print-to-Online or Online-to-Print)
            when unambiguous. Collisions or conflicting title assignments are isolated as <code className="font-mono">ambiguous</code> and
            excluded from automated multi-set merges.
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
            • Rejected records link to internal administration paths (<code className="font-mono">/admin/application/...</code>).
            <br /><br />
            <strong>Categorical Rule:</strong> All <code className="font-mono">/admin/application/...</code> paths are treated as strictly
            confidential internal administrative routes and are unconditionally barred from public exports, bundles, and UI rendering.
          </p>
        </section>

        {/* SINTA Editor URLs & Personal Data Safeguard */}
        <section className="card">
          <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
            4. SINTA Editor URL & Personal Data Exclusions
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
            • DOAJ internal account fields (<code className="font-mono">Owner</code>, <code className="font-mono">Account Name</code>,{' '}
            <code className="font-mono">Account Email</code>) are barred from ingestion and export.
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
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Source Logical Label</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Baseline Source Rows</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Source Columns</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Export / Snapshot Date</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Integrity Verification</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--light-grey)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>DOAJ Rejected Applications</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>8,898</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>53</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>2026-11-14 22:08:29 UTC</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--mid-green)', fontWeight: 600 }}>100% Conserved</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--light-grey)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>DOAJ Last Withdrawn</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>570</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>59</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>2026-11-14 22:08:52 UTC</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--mid-green)', fontWeight: 600 }}>100% Conserved</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--light-grey)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>SINTA National Database</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>16,620</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>17</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>2026-11-15 (Final Census)</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--mid-green)', fontWeight: 600 }}>100% Conserved</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
