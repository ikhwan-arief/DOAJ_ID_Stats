import React from 'react';
import { SYNTHETIC_JOURNALS } from '../data/synthetic';
import { RankBadge, Alert } from '../components/common/UIPrimitives';
import { GlobalFilterState } from '../types';

interface RejectionHistoryPageProps {
  filters: GlobalFilterState;
  onSelectJournal: (journalId: string) => void;
}

export const RejectionHistoryPage: React.FC<RejectionHistoryPageProps> = ({
  filters,
  onSelectJournal,
}) => {
  // Filter journals that have at least one rejection
  const journalsWithRejections = React.useMemo(() => {
    return SYNTHETIC_JOURNALS.filter((j) => {
      if (j.total_rejections === 0) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = j.title.toLowerCase().includes(q);
        const matchIssn =
          j.p_issn_raw.toLowerCase().includes(q) || j.e_issn_raw.toLowerCase().includes(q);
        if (!matchTitle && !matchIssn) return false;
      }
      if (filters.sintaRank !== 'all' && j.sinta_rank !== filters.sintaRank) {
        return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
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
          Route 3 • Temporal Chronology
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Rejection Frequency & Event Chronology
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Detailed chronology and recurrence analysis of application rejection records. Distinguishes single-event
          applications from repeated multi-year rejections, same-day recorded batches, and temporal gaps between events.
        </p>
      </div>

      <Alert type="note" title="Analytical Principle: Repeated Records vs Intentional Resubmission">
        Multiple rejection records attached to a journal identifier document sequential procedural outcomes.
        They do not automatically prove intentional re-applications or editorial policy changes without independent
        application metadata.
      </Alert>

      {/* Frequency Distribution Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div className="card" style={{ borderLeft: '4px solid var(--sanguine)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Single Rejection (1x)
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            5,480
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>79.4% of rejected journals</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--grapefruit)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Two Rejections (2x)
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            1,050
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>15.2% of rejected journals</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--salmon)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Three Rejections (3x)
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            290
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>4.2% of rejected journals</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warm-black)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Four+ Rejections (≥4x)
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            80
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>1.2% high-recurrence journals</span>
        </div>
      </div>

      {/* Recurrence Directory Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Journals with Recorded Rejections & Chronological Event Timelines
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
                <th style={{ padding: 'var(--space-3)' }}>Journal Title</th>
                <th style={{ padding: 'var(--space-3)' }}>P-ISSN / E-ISSN</th>
                <th style={{ padding: 'var(--space-3)' }}>SINTA Rank</th>
                <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Total Rejections</th>
                <th style={{ padding: 'var(--space-3)' }}>Dated Rejection Timeline</th>
                <th style={{ padding: 'var(--space-3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {journalsWithRejections.map((j) => (
                <tr key={j.journal_id} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                    <button
                      type="button"
                      onClick={() => onSelectJournal(j.journal_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        textAlign: 'left',
                        color: 'var(--warm-black)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {j.title}
                    </button>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 'normal' }}>
                      {j.publisher}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    <div>P: {j.p_issn_raw || '—'}</div>
                    <div>E: {j.e_issn_raw || '—'}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <RankBadge rank={j.sinta_rank} />
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: j.total_rejections > 1 ? 'var(--sanguine-10)' : 'var(--warm-black-05)',
                        color: j.total_rejections > 1 ? 'var(--sanguine)' : 'var(--warm-black)',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {j.total_rejections}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {j.rejection_dates.map((date, idx) => (
                        <span
                          key={idx}
                          style={{
                            backgroundColor: 'var(--light-grey)',
                            border: '1px solid var(--neutral-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px 6px',
                            fontSize: 'var(--text-xs)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {date}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', minHeight: '30px', fontSize: 'var(--text-xs)' }}
                      onClick={() => onSelectJournal(j.journal_id)}
                    >
                      Full Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
