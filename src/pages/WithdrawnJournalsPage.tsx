import React from 'react';
import { SYNTHETIC_WITHDRAWN } from '../data/synthetic';
import { RankBadge, Alert } from '../components/common/UIPrimitives';
import { GlobalFilterState } from '../types';

interface WithdrawnJournalsPageProps {
  filters: GlobalFilterState;
  onSelectJournal: (journalId: string) => void;
}

export const WithdrawnJournalsPage: React.FC<WithdrawnJournalsPageProps> = ({
  filters,
  onSelectJournal,
}) => {
  const filteredWithdrawn = React.useMemo(() => {
    return SYNTHETIC_WITHDRAWN.filter((rec) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = rec.journal_title.toLowerCase().includes(q);
        const matchIssn =
          rec.p_issn_raw.toLowerCase().includes(q) || rec.e_issn_raw.toLowerCase().includes(q);
        if (!matchTitle && !matchIssn) return false;
      }
      if (filters.sintaRank !== 'all' && rec.sinta_rank !== filters.sintaRank) {
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
            color: 'var(--dark-green)',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          Route 4 • Historical Delisting
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Withdrawn Journals Directory
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Indonesian journals recorded in the DOAJ Last Withdrawn dataset (2022–2026). Captures withdrawal dates,
          reinstatement records where present, and intersection with current national accreditation rankings.
        </p>
      </div>

      <Alert type="important" title="Status Interpretation Safeguard">
        A record in the historical withdrawal dataset documents a past withdrawal event.
        It must <strong>never</strong> be reported as 'currently withdrawn from DOAJ' without live,
        real-time verification against the live DOAJ index, as journals may have been subsequently reinstated.
      </Alert>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <div className="card" style={{ borderLeft: '4px solid var(--dark-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Total Withdrawal Records
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            570
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Baseline source rows (100% conserved)</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--mid-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Matched to SINTA Accreditation
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            390
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>68.4% of withdrawn records</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--yellow)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Recorded Reinstatements
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            64
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Source contains Last Reinstated Date</span>
        </div>
      </div>

      {/* Withdrawn Records Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            Showing {filteredWithdrawn.length} withdrawn journal records
          </span>
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
                <th style={{ padding: 'var(--space-3)' }}>Record ID</th>
                <th style={{ padding: 'var(--space-3)' }}>Journal Title</th>
                <th style={{ padding: 'var(--space-3)' }}>P-ISSN / E-ISSN</th>
                <th style={{ padding: 'var(--space-3)' }}>Withdrawal Date</th>
                <th style={{ padding: 'var(--space-3)' }}>Reinstatement Date</th>
                <th style={{ padding: 'var(--space-3)' }}>SINTA Rank</th>
                <th style={{ padding: 'var(--space-3)' }}>DOAJ Profile</th>
                <th style={{ padding: 'var(--space-3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawn.map((rec) => (
                <tr key={rec.source_record_id} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                  <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
                    {rec.source_record_id}
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                    <button
                      type="button"
                      onClick={() => onSelectJournal(rec.journal_id)}
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
                      {rec.journal_title}
                    </button>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 'normal' }}>
                      {rec.publisher}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    <div>P: {rec.p_issn_raw || '—'}</div>
                    <div>E: {rec.e_issn_raw || '—'}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                    {rec.last_withdrawn_date}
                  </td>
                  <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                    {rec.last_reinstated_date ? (
                      <span className="badge badge-sinta">{rec.last_reinstated_date}</span>
                    ) : (
                      <span style={{ color: 'var(--dark-grey)', fontStyle: 'italic' }}>None recorded</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <RankBadge rank={rec.sinta_rank} />
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    {rec.doaj_profile_url ? (
                      <a
                        href={rec.doaj_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}
                      >
                        Public Profile ↗
                      </a>
                    ) : (
                      <span style={{ color: 'var(--dark-grey)', fontSize: 'var(--text-xs)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', minHeight: '30px', fontSize: 'var(--text-xs)' }}
                      onClick={() => onSelectJournal(rec.journal_id)}
                    >
                      Profile
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
