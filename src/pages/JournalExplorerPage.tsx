import React from 'react';
import { SYNTHETIC_JOURNALS } from '../data/synthetic';
import { RankBadge } from '../components/common/UIPrimitives';
import { GlobalFilterState, SyntheticJournalRecord } from '../types';

interface JournalExplorerPageProps {
  filters: GlobalFilterState;
  selectedJournalId: string | null;
  onSelectJournal: (journalId: string | null) => void;
}

export const JournalExplorerPage: React.FC<JournalExplorerPageProps> = ({
  filters,
  selectedJournalId,
  onSelectJournal,
}) => {
  const filteredJournals = React.useMemo(() => {
    return SYNTHETIC_JOURNALS.filter((j) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = j.title.toLowerCase().includes(q);
        const matchIssn =
          j.p_issn_raw.toLowerCase().includes(q) || j.e_issn_raw.toLowerCase().includes(q);
        const matchPub = j.publisher.toLowerCase().includes(q);
        if (!matchTitle && !matchIssn && !matchPub) return false;
      }
      if (filters.sintaRank !== 'all' && j.sinta_rank !== filters.sintaRank) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const activeJournal: SyntheticJournalRecord = React.useMemo(() => {
    if (selectedJournalId) {
      const found = SYNTHETIC_JOURNALS.find((j) => j.journal_id === selectedJournalId);
      if (found) return found;
    }
    return filteredJournals[0] || SYNTHETIC_JOURNALS[0];
  }, [selectedJournalId, filteredJournals]);

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
          Route 6 • Journal Profile & Provenance
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Journal Explorer & Reconciled Identity Dossier
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Detailed profile of reconciled scholarly journals. Inspect ISSN media pairs, accreditation status,
          verified public URLs (including SINTA Editor URLs and public DOAJ profiles), and associated historical event timelines.
        </p>
      </div>

      {/* Main Two-Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {/* Left Column: Journal List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--light-grey)',
              borderBottom: '1px solid var(--neutral-border)',
            }}
          >
            <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>
              Reconciled Journals ({filteredJournals.length})
            </h3>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {filteredJournals.map((j) => {
              const isSelected = activeJournal && activeJournal.journal_id === j.journal_id;
              return (
                <button
                  key={j.journal_id}
                  type="button"
                  onClick={() => onSelectJournal(j.journal_id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--space-3) var(--space-4)',
                    border: 'none',
                    borderBottom: '1px solid var(--light-grey)',
                    backgroundColor: isSelected ? 'var(--warm-black-05)' : 'var(--white)',
                    borderLeft: isSelected ? '4px solid var(--sanguine)' : '4px solid transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--warm-black)' }}>
                    {j.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px' }}>
                    <RankBadge rank={j.sinta_rank} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontFamily: 'var(--font-mono)' }}>
                      {j.e_issn_raw || j.p_issn_raw || 'No ISSN'}
                    </span>
                    {j.total_rejections > 0 && (
                      <span className="badge badge-rejected">{j.total_rejections} rejections</span>
                    )}
                    {j.total_withdrawals > 0 && (
                      <span className="badge badge-withdrawn">{j.total_withdrawals} withdrawn</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Reconciled Dossier */}
        {activeJournal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--dark-grey)', fontWeight: 600 }}>
                    Reconciled Journal ID: {activeJournal.journal_id}
                  </span>
                  <h3 style={{ fontSize: 'var(--text-xl)', marginTop: '4px', marginBottom: 'var(--space-2)' }}>
                    {activeJournal.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <RankBadge rank={activeJournal.sinta_rank} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)' }}>
                      Publisher: <strong>{activeJournal.publisher}</strong> ({activeJournal.country})
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="badge badge-neutral">Match: {activeJournal.match_method}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
                    Quality: {activeJournal.issn_quality}
                  </span>
                </div>
              </div>

              {/* ISSN and Identity Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 'var(--space-3)',
                  marginTop: 'var(--space-4)',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--light-grey)',
                }}
              >
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>Print ISSN (P-ISSN)</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '2px' }}>
                    {activeJournal.p_issn_raw || '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>Online ISSN (E-ISSN)</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '2px' }}>
                    {activeJournal.e_issn_raw || '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>Subjects</span>
                  <div style={{ fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                    {activeJournal.subjects.join(', ') || 'Unspecified'}
                  </div>
                </div>
              </div>

              {/* Public Link Verification Bar */}
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--light-grey)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--warm-black)' }}>
                  Validated Public Links:
                </span>
                {activeJournal.public_journal_url && (
                  <a
                    href={activeJournal.public_journal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', minHeight: '32px', fontSize: 'var(--text-xs)' }}
                  >
                    Public Journal Website ↗
                  </a>
                )}
                {activeJournal.editor_url && (
                  <a
                    href={activeJournal.editor_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', minHeight: '32px', fontSize: 'var(--text-xs)' }}
                  >
                    SINTA Editor Team Link ↗
                  </a>
                )}
                {activeJournal.doaj_profile_url ? (
                  <a
                    href={activeJournal.doaj_profile_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-accent"
                    style={{ padding: '4px 10px', minHeight: '32px', fontSize: 'var(--text-xs)' }}
                  >
                    View DOAJ Journal Profile (/toc/...) ↗
                  </a>
                ) : (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontStyle: 'italic' }}>
                    (No public DOAJ profile link; internal admin routes categorically blocked)
                  </span>
                )}
              </div>
            </div>

            {/* Historical Events Timeline for this journal */}
            <div className="card">
              <h4 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)' }}>
                Recorded Event History for this Journal
              </h4>

              {activeJournal.rejection_dates.length === 0 && !activeJournal.last_withdrawn_date ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)' }}>
                  No historical rejection or withdrawal records attached to this journal identifier.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {activeJournal.rejection_dates.map((date, idx) => (
                    <li
                      key={`rej-${idx}`}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        backgroundColor: 'var(--sanguine-10)',
                        borderLeft: '4px solid var(--sanguine)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      <span>
                        <strong>Rejection Record #{idx + 1}:</strong> Application outcome logged
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        {date}
                      </span>
                    </li>
                  ))}
                  {activeJournal.last_withdrawn_date && (
                    <li
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        backgroundColor: 'var(--dark-green-10)',
                        borderLeft: '4px solid var(--dark-green)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      <span>
                        <strong>Withdrawal Record:</strong> Delisting date from DOAJ index
                        {activeJournal.last_reinstated_date && (
                          <span style={{ color: 'var(--dark-green)', marginLeft: '6px' }}>
                            (Reinstated: {activeJournal.last_reinstated_date})
                          </span>
                        )}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        {activeJournal.last_withdrawn_date}
                      </span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
