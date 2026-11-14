import React from 'react';
import { MetricCard, Alert } from '../components/common/UIPrimitives';
import { SYNTHETIC_KPIS } from '../data/synthetic';
import { GlobalFilterState } from '../types';

interface OverviewPageProps {
  filters: GlobalFilterState;
  onNavigateToRoute: (route: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ filters, onNavigateToRoute }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Page Header */}
      <div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            color: 'var(--sanguine)',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          Observatory Dashboard • Route 1
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Observatory Overview & Dataset Intersections
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Synthesis of Indonesian scholarly journal indexing dynamics across the Directory of Open Access Journals
          (DOAJ) rejected applications (2022–2026), withdrawn journals, and the national SINTA database (snapshot 15 Nov 2026).
        </p>
      </div>

      <Alert type="note" title="WP2 Synthetic Data Notice">
        You are currently viewing the accessible UI foundation powered by validated synthetic test fixtures.
        Actual deterministic identity reconciliation, Venn/UpSet partitions, and production metrics will be
        generated in WP3 by Codex and linked in WP4. All numbers shown here are illustrative synthetic values.
      </Alert>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <MetricCard
          label="Total Rejection Records"
          value={SYNTHETIC_KPIS.totalSourceRecords.rejected}
          unit="records"
          description="Source rejection application events (2022–2026)"
          provenance="DOAJ Rejected CSV (8,898 baseline)"
          color="var(--sanguine)"
        />
        <MetricCard
          label="Total Withdrawn Records"
          value={SYNTHETIC_KPIS.totalSourceRecords.withdrawn}
          unit="records"
          description="Source journal withdrawal records (2022–2026)"
          provenance="DOAJ Withdrawn CSV (570 baseline)"
          color="var(--dark-green)"
        />
        <MetricCard
          label="Total SINTA Population"
          value={SYNTHETIC_KPIS.totalSourceRecords.sinta}
          unit="journals"
          description="National accreditation census (15 Nov 2026)"
          provenance="SINTA Database Final (16,620 baseline)"
          color="var(--mid-green)"
        />
        <MetricCard
          label="Repeat Rejection Records"
          value={SYNTHETIC_KPIS.repeatRejectionCount}
          unit="records"
          description="Applications for journals with ≥2 historical rejections"
          provenance="Synthetic Multi-event Timeline"
          color="var(--grapefruit)"
        />
      </div>

      {/* Three-Set Venn / Intersections Representation */}
      <section className="card" aria-labelledby="intersection-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h3 id="intersection-heading" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
              Dataset Intersections (DOAJ Rejected ∩ DOAJ Withdrawn ∩ SINTA)
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)' }}>
              Mode: <strong>{filters.matchingMode.toUpperCase()}</strong> ISSN matching • Metric Grain:{' '}
              <strong>{filters.metricView === 'records' ? 'Source Event Records' : 'Unique Reconciled Journals'}</strong>
            </p>
          </div>
          <span className="badge badge-neutral">UpSet & Venn Foundation</span>
        </div>

        {/* Tabular Alternative for Intersections (Accessible & Exact) */}
        <div style={{ marginTop: 'var(--space-4)', overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--text-sm)',
              textAlign: 'left',
            }}
          >
            <caption style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 'var(--space-2)' }}>
              Accessible Intersection Partitions (Synthetic Representation)
            </caption>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--neutral-border)', backgroundColor: 'var(--light-grey)' }}>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Intersection Partition</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Description</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>Reconciled Journals</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>Source Records</th>
                <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--light-grey)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--sanguine)' }}>●</span> Rejected Only
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Rejection records not matched to SINTA or Withdrawn</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>5,120</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>6,008</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', minHeight: '32px' }} onClick={() => onNavigateToRoute('rejected')}>
                    View Rows
                  </button>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--light-grey)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--grapefruit)' }}>●</span> Rejected ∩ SINTA
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Accredited Indonesian journals with DOAJ rejection records</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>2,610</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>2,890</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', minHeight: '32px' }} onClick={() => onNavigateToRoute('sinta')}>
                    Drill Down
                  </button>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--light-grey)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--dark-green)' }}>●</span> Withdrawn Only
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Withdrawn from DOAJ, outside current SINTA census</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>180</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>180</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', minHeight: '32px' }} onClick={() => onNavigateToRoute('withdrawn')}>
                    View Rows
                  </button>
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--light-grey)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--mid-green)' }}>●</span> Withdrawn ∩ SINTA
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Accredited Indonesian journals with DOAJ withdrawal records</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>390</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>390</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', minHeight: '32px' }} onClick={() => onNavigateToRoute('withdrawn')}>
                    Drill Down
                  </button>
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid var(--neutral-border)', backgroundColor: 'var(--warm-black-05)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 700 }}>
                  <span style={{ color: 'var(--warm-black)' }}>●</span> Rejected ∩ Withdrawn ∩ SINTA
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Journals present in all three sources</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>45</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>98</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>
                  <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', minHeight: '32px' }} onClick={() => onNavigateToRoute('explorer')}>
                    Explore
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Observational Guidelines */}
      <section className="card">
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
          Observational & Analytical Framework
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
          1. <strong>Event Records vs Reconciled Journals:</strong> A single journal can apply multiple times,
          resulting in several rejection records across years. Metrics in this observatory consistently distinguish
          source events from unique journal entities.
          <br />
          2. <strong>As-of Snapshot Semantics:</strong> SINTA ranks (S1–S6, NA) reflect accreditation status on the
          snapshot date (15 Nov 2026) and must not be misinterpreted as the journal's accreditation level at the time
          of historical DOAJ rejection.
          <br />
          3. <strong>Neutral Editorial Stance:</strong> A rejection or withdrawal record documents procedural review
          outcomes and does not inherently signify academic misconduct.
        </p>
      </section>
    </div>
  );
};
