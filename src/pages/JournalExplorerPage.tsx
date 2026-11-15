import React, { useEffect, useState, useMemo } from 'react';
import { loadDimJournals, loadFactRejected, loadFactWithdrawn, loadSintaSnapshot } from '../data/loader';
import { DimJournalRecord, FactRejectedRecord, FactWithdrawnRecord, SintaSnapshotRecord, GlobalFilterState } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { JournalEventTimelineChart } from '../components/charts/JournalEventTimelineChart';

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
  const [journals, setJournals] = useState<DimJournalRecord[] | null>(null);
  const [rejections, setRejections] = useState<FactRejectedRecord[] | null>(null);
  const [withdrawns, setWithdrawns] = useState<FactWithdrawnRecord[] | null>(null);
  const [sintas, setSintas] = useState<Map<string, SintaSnapshotRecord> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadDimJournals(), loadFactRejected(), loadFactWithdrawn(), loadSintaSnapshot()])
      .then(([dim, rej, withdr, sintaList]) => {
        setJournals(dim);
        setRejections(rej);
        setWithdrawns(withdr);
        const map = new Map<string, SintaSnapshotRecord>();
        sintaList.forEach((s) => map.set(s.journal_id, s));
        setSintas(map);
      })
      .catch((err) => setError(err.message || 'Failed to load journal explorer data'));
  }, []);

  const filteredJournals = useMemo(() => {
    if (!journals) return [];
    return journals.filter((j) => {
      // Prioritize journals with DOAJ activity for exploration relevance
      if (filters.eventKind === 'rejected' && !j.in_rejected) return false;
      if (filters.eventKind === 'withdrawn' && !j.in_withdrawn) return false;

      if (filters.sintaRank !== 'all' && j.sinta_rank !== filters.sintaRank) {
        return false;
      }

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = j.display_title.toLowerCase().includes(q);
        const matchId = j.journal_id.toLowerCase().includes(q);
        if (!matchTitle && !matchId) return false;
      }

      return true;
    });
  }, [journals, filters]);

  // Active journal selection
  const activeJournal = useMemo(() => {
    if (!journals || journals.length === 0) return null;
    if (selectedJournalId) {
      const found = journals.find((j) => j.journal_id === selectedJournalId);
      if (found) return found;
    }
    // Default to first filtered journal that has either rejection or withdrawal
    const firstActive = filteredJournals.find((j) => j.in_rejected || j.in_withdrawn) || filteredJournals[0];
    return firstActive || journals[0];
  }, [selectedJournalId, journals, filteredJournals]);

  // Associated event records
  const journalRejections = useMemo(() => {
    if (!activeJournal || !rejections) return [];
    return rejections.filter((r) => r.journal_id === activeJournal.journal_id);
  }, [activeJournal, rejections]);

  const journalWithdrawns = useMemo(() => {
    if (!activeJournal || !withdrawns) return [];
    return withdrawns.filter((w) => w.journal_id === activeJournal.journal_id);
  }, [activeJournal, withdrawns]);

  const activeSinta = useMemo(() => {
    if (!activeJournal || !sintas) return null;
    return sintas.get(activeJournal.journal_id) || null;
  }, [activeJournal, sintas]);

  // Resolve best available ISSNs and URLs from associated records
  const sampleRej = journalRejections[0];
  const sampleWith = journalWithdrawns[0];

  const pIssn = activeSinta?.p_issn_raw || sampleRej?.p_issn_raw || sampleWith?.p_issn_raw || '—';
  const eIssn = activeSinta?.e_issn_raw || sampleRej?.e_issn_raw || sampleWith?.e_issn_raw || '—';

  const journalWebUrl = activeSinta?.website_url || sampleRej?.journal_url || sampleWith?.journal_url;
  const sintaEditorUrl = activeSinta?.editor_url;
  const doajProfileUrl = sampleWith?.doaj_profile_url; // Validated /toc/... profile URL only

  if (error) {
    return <Alert type="warning" title="Error Loading Journal Explorer">{error}</Alert>;
  }

  if (!journals || !rejections || !withdrawns || !sintas) {
    return <LoadingState message="Loading reconciled journal identities (18,370 resolved entities)..." />;
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
          Route 6 • Journal Profile & Provenance
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Journal Explorer & Reconciled Identity Dossier
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Detailed profile of reconciled scholarly journals ({journals.length.toLocaleString()} resolved entities).
          Inspect ISSN media pairs, accreditation status, verified public URLs (including SINTA Editor URLs and public DOAJ profiles),
          and linked application event timelines.
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
              Reconciled Journals ({filteredJournals.length.toLocaleString()})
            </h3>
          </div>
          <div style={{ maxHeight: '640px', overflowY: 'auto' }}>
            {filteredJournals.slice(0, 100).map((j) => {
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
                    {j.display_title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px', flexWrap: 'wrap' }}>
                    <RankBadge rank={j.sinta_rank} />
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontFamily: 'var(--font-mono)' }}>
                      {j.journal_id}
                    </span>
                    {j.in_rejected && <span className="badge badge-rejected">Rejected Record</span>}
                    {j.in_withdrawn && <span className="badge badge-withdrawn">Withdrawn</span>}
                    {j.in_sinta && <span className="badge badge-sinta">SINTA Census</span>}
                  </div>
                </button>
              );
            })}
            {filteredJournals.length > 100 && (
              <div style={{ padding: 'var(--space-3)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', backgroundColor: 'var(--light-grey)' }}>
                Showing top 100 matches. Use search filter above to narrow specific titles or ISSNs.
              </div>
            )}
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
                    {activeJournal.display_title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <RankBadge rank={activeJournal.sinta_rank} />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)' }}>
                      National Accreditation Status: <strong>{activeJournal.sinta_rank}</strong>
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="badge badge-neutral">
                    {activeJournal.journal_id.startsWith('sinta:') ? 'SINTA Identity Key' : 'DOAJ Record Key'}
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
                    {pIssn}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>Online ISSN (E-ISSN)</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '2px' }}>
                    {eIssn}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>Subject Area</span>
                  <div style={{ fontSize: 'var(--text-xs)', marginTop: '2px' }}>
                    {activeSinta?.subject_area || 'Not recorded in SINTA'}
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
                {journalWebUrl && (
                  <a
                    href={journalWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', minHeight: '32px', fontSize: 'var(--text-xs)' }}
                  >
                    Public Journal Website ↗
                  </a>
                )}
                {sintaEditorUrl && (
                  <a
                    href={sintaEditorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '4px 10px', minHeight: '32px', fontSize: 'var(--text-xs)' }}
                  >
                    SINTA Editor Team Link ↗
                  </a>
                )}
                {doajProfileUrl ? (
                  <a
                    href={doajProfileUrl}
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

            {/* Visual Timeline of Journal Events */}
            <JournalEventTimelineChart
              rejections={journalRejections}
              withdrawals={journalWithdrawns}
              journalTitle={activeJournal.display_title}
            />

            {/* Historical Events Timeline for this journal */}
            <div className="card">
              <h4 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)' }}>
                Recorded Event History ({journalRejections.length + journalWithdrawns.length} total events)
              </h4>

              {journalRejections.length === 0 && journalWithdrawns.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)' }}>
                  No historical rejection or withdrawal records attached to this journal identifier.
                </p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {journalRejections.map((rej, idx) => (
                    <li
                      key={rej.source_record_id}
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
                      <div>
                        <strong>Rejection Record #{idx + 1}:</strong> {rej.source_record_id}
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
                          Match Status: {rej.strict_match_status} ({rej.strict_match_method || 'no match'})
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        {rej.event_day || rej.event_at_raw || '—'}
                      </span>
                    </li>
                  ))}
                  {journalWithdrawns.map((w) => (
                    <li
                      key={w.source_record_id}
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
                      <div>
                        <strong>Withdrawal Record:</strong> {w.source_record_id}
                        {w.last_reinstated_day && (
                          <span style={{ color: 'var(--dark-green)', marginLeft: '6px' }}>
                            (Reinstated: {w.last_reinstated_day})
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                        {w.last_withdrawn_day || w.last_withdrawn_date_raw || '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
