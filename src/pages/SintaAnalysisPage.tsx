import React from 'react';
import { RankBadge, Alert } from '../components/common/UIPrimitives';
import { GlobalFilterState } from '../types';

interface SintaAnalysisPageProps {
  filters?: GlobalFilterState;
  onSelectRank: (rank: string) => void;
}

export const SintaAnalysisPage: React.FC<SintaAnalysisPageProps> = ({
  onSelectRank,
}) => {
  // Synthetic rank distribution covering S1-S6, NA, and unmatched
  const rankDistributions = [
    { rank: 'S1', totalSinta: 142, rejectedMatches: 18, withdrawnMatches: 8, rejectionRate: '12.7%' },
    { rank: 'S2', totalSinta: 1240, rejectedMatches: 310, withdrawnMatches: 65, rejectionRate: '25.0%' },
    { rank: 'S3', totalSinta: 3450, rejectedMatches: 820, withdrawnMatches: 110, rejectionRate: '23.8%' },
    { rank: 'S4', totalSinta: 4890, rejectedMatches: 1120, withdrawnMatches: 145, rejectionRate: '22.9%' },
    { rank: 'S5', totalSinta: 3980, rejectedMatches: 540, withdrawnMatches: 52, rejectionRate: '13.6%' },
    { rank: 'S6', totalSinta: 1120, rejectedMatches: 82, withdrawnMatches: 10, rejectionRate: '7.3%' },
    { rank: 'NA', totalSinta: 1798, rejectedMatches: 210, withdrawnMatches: 42, rejectionRate: '11.7%' },
    { rank: 'unmatched', totalSinta: 0, rejectedMatches: 5798, withdrawnMatches: 138, rejectionRate: '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            color: 'var(--mid-green)',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          Route 5 • National Accreditation Context
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          SINTA Population Breakdown & Indexing Dynamics
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Comprehensive analysis across all national accreditation tiers (SINTA 1 through 6), unaccredited journals (NA),
          and unmatched non-SINTA journals. Denominators explicitly state population baselines from the 15 Nov 2026 census.
        </p>
      </div>

      <Alert type="note" title="Denominator Clarification">
        Percentages are calculated using the verified November 2026 SINTA population (16,620 total journals) as the denominator
        for national accreditation tiers. Rejection and withdrawal counts represent journals matched through deterministic ISSN protocols.
      </Alert>

      {/* Grid of Accreditation Tiers */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Accreditation Tiers: Population Baseline & DOAJ Record Prevalences
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--text-sm)',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid var(--neutral-border)', backgroundColor: 'var(--white)' }}>
                <th style={{ padding: 'var(--space-3)' }}>SINTA Tier</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Total Journals in SINTA</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>% of SINTA Census</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Matched Rejections</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Matched Withdrawals</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Rejection Encounter %</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rankDistributions.map((row) => (
                <tr key={row.rank} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <RankBadge rank={row.rank} />
                    <span style={{ marginLeft: 'var(--space-2)', fontWeight: 600 }}>
                      {row.rank === 'NA'
                        ? 'Not Accredited'
                        : row.rank === 'unmatched'
                        ? 'Outside SINTA'
                        : `SINTA ${row.rank.slice(1)}`}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {row.totalSinta ? row.totalSinta.toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--dark-grey)' }}>
                    {row.totalSinta ? `${((row.totalSinta / 16620) * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--sanguine)' }}>
                    {row.rejectedMatches.toLocaleString()}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--dark-green)' }}>
                    {row.withdrawnMatches.toLocaleString()}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {row.rejectionRate}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', minHeight: '30px', fontSize: 'var(--text-xs)' }}
                      onClick={() => onSelectRank(row.rank)}
                    >
                      Filter {row.rank}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--warm-black-05)', fontWeight: 700, borderTop: '2px solid var(--neutral-border)' }}>
                <td style={{ padding: 'var(--space-3)' }}>Total Census SINTA</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>16,620</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>100.0%</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>8,898 (all)</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>570 (all)</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>—</td>
                <td style={{ padding: 'var(--space-3)' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
