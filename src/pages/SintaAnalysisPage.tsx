import React, { useEffect, useState } from 'react';
import { loadSummary } from '../data/loader';
import { SummaryPublic, GlobalFilterState } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';

interface SintaAnalysisPageProps {
  filters?: GlobalFilterState;
  onSelectRank: (rank: string) => void;
}

export const SintaAnalysisPage: React.FC<SintaAnalysisPageProps> = ({
  onSelectRank,
}) => {
  const [summary, setSummary] = useState<SummaryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary()
      .then((s) => setSummary(s))
      .catch((err) => setError(err.message || 'Failed to load summary dataset'));
  }, []);

  if (error) {
    return <Alert type="warning" title="Error Loading SINTA Analysis">{error}</Alert>;
  }

  if (!summary) {
    return <LoadingState message="Loading national SINTA population census..." />;
  }

  // Exact SINTA census numbers from Codex WP3 summary
  const sintaTotal = summary.source_record_counts.sinta; // 16,620
  const sintaRanks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched'];

  const sintaRows = sintaRanks.map((rank) => {
    const sintaCount = summary.sinta_rank_unique_journal_counts[rank] || 0;
    const rejectedRecordMatches = summary.rejected_rank_source_record_counts[rank] || 0;
    const rejectedJournalMatches = summary.rejected_rank_unique_journal_counts[rank] || 0;
    const percentage = sintaCount > 0 ? ((sintaCount / sintaTotal) * 100).toFixed(2) : '—';
    const rejectionRate = sintaCount > 0
      ? `${((rejectedJournalMatches / sintaCount) * 100).toFixed(1)}%`
      : '—';

    return {
      rank,
      sintaCount,
      percentage,
      rejectedRecordMatches,
      rejectedJournalMatches,
      rejectionRate,
    };
  });

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
          and unmatched non-SINTA journals. Denominators explicitly state population baselines from the 15 Nov 2026 census (16,620 total journals).
        </p>
      </div>

      <Alert type="note" title="Denominator Clarification">
        Percentages are calculated using the verified November 2026 SINTA census ({sintaTotal.toLocaleString()} total journals)
        as the official denominator. Rejection counts represent applications matched to these journals under strict ISSN reconciliation.
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
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Matched Rejection Records</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Distinct Rejected Journals</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Journal Prevalence</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sintaRows.map((row) => (
                <tr key={row.rank} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <RankBadge rank={row.rank} />
                    <span style={{ marginLeft: 'var(--space-2)', fontWeight: 600 }}>
                      {row.rank === 'NA'
                        ? 'Not Accredited (NA)'
                        : row.rank === 'unmatched'
                        ? 'Outside SINTA Database'
                        : `SINTA ${row.rank.slice(1)}`}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {row.sintaCount ? row.sintaCount.toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--dark-grey)' }}>
                    {row.percentage === '—' ? '—' : `${row.percentage}%`}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--sanguine)' }}>
                    {row.rejectedRecordMatches.toLocaleString()}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {row.rejectedJournalMatches.toLocaleString()}
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
                <td style={{ padding: 'var(--space-3)' }}>Total SINTA Census</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {sintaTotal.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>100.00%</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {Object.entries(summary.rejected_rank_source_record_counts)
                    .filter(([rank]) => rank !== 'unmatched' && rank !== 'ambiguous')
                    .reduce((sum, [, count]) => sum + count, 0)
                    .toLocaleString()} matched
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {Object.values(summary.rejected_rank_unique_journal_counts).reduce((sum, count) => sum + count, 0).toLocaleString()}
                </td>
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
