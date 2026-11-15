import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  loadDimJournals,
  loadFactRejected,
  loadFactWithdrawn,
  loadFactAccepted,
  loadFactDoajCurrent,
  loadSintaSnapshot,
} from '../data/loader';
import {
  DimJournalRecord,
  FactRejectedRecord,
  FactWithdrawnRecord,
  FactAcceptedRecord,
  FactDoajCurrentRecord,
  SintaSnapshotRecord,
  GlobalFilterState,
  CurrentDoajStatus,
} from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { BackNavigation } from '../components/common/BackNavigation';
import { JournalEventTimelineChart } from '../components/charts/JournalEventTimelineChart';
import { formatMatchingMethod, formatMatchStatus, getMatchingExplanation } from '../lib/matchingLabels';
import {
  buildJournalIdentityIndex,
  getJournalProfileRoute,
  isValidIssnChecksum,
  JournalIdentityIndex,
} from '../lib/journalRoutes';

interface JournalExplorerPageProps {
  filters: GlobalFilterState;
  journalSlug: string | null;
  onNavigateToJournal: (slug: string) => void;
  onBack: () => void;
  backTargetLabel?: string;
}

export const JournalExplorerPage: React.FC<JournalExplorerPageProps> = ({
  filters,
  journalSlug,
  onNavigateToJournal,
  onBack,
  backTargetLabel,
}) => {
  const [journals, setJournals] = useState<DimJournalRecord[] | null>(null);
  const [rejections, setRejections] = useState<FactRejectedRecord[] | null>(null);
  const [withdrawns, setWithdrawns] = useState<FactWithdrawnRecord[] | null>(null);
  const [accepted, setAccepted] = useState<FactAcceptedRecord[] | null>(null);
  const [doajCurrent, setDoajCurrent] = useState<FactDoajCurrentRecord[] | null>(null);
  const [sintas, setSintas] = useState<Map<string, SintaSnapshotRecord> | null>(null);
  const [localSearch, setLocalSearch] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isProvenanceOpen, setIsProvenanceOpen] = useState<boolean>(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      loadDimJournals(),
      loadFactRejected(),
      loadFactWithdrawn(),
      loadFactAccepted(),
      loadFactDoajCurrent(),
      loadSintaSnapshot(),
    ])
      .then(([dim, rej, withdr, acc, curr, sintaList]) => {
        setJournals(dim);
        setRejections(rej);
        setWithdrawns(withdr);
        setAccepted(acc);
        setDoajCurrent(curr);
        const map = new Map<string, SintaSnapshotRecord>();
        sintaList.forEach((s) => map.set(s.journal_id, s));
        setSintas(map);
      })
      .catch((err) => setError(err.message || 'Failed to load journal explorer data'));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build the deterministic ISSN identity index
  const identityIndex = useMemo<JournalIdentityIndex | null>(() => {
    if (!journals) return null;
    return buildJournalIdentityIndex(journals, sintas, doajCurrent, rejections, withdrawns, accepted);
  }, [journals, sintas, doajCurrent, rejections, withdrawns, accepted]);

  // Quick lookup indices by journal_id
  const currentByJournal = useMemo(() => {
    if (!doajCurrent) return new Map<string, FactDoajCurrentRecord>();
    const map = new Map<string, FactDoajCurrentRecord>();
    doajCurrent.forEach((c) => {
      if (!map.has(c.journal_id)) {
        map.set(c.journal_id, c);
      }
    });
    return map;
  }, [doajCurrent]);

  const rejectionsByJournal = useMemo(() => {
    if (!rejections) return new Map<string, FactRejectedRecord[]>();
    const map = new Map<string, FactRejectedRecord[]>();
    rejections.forEach((r) => {
      if (!r.journal_id) return;
      const list = map.get(r.journal_id) || [];
      list.push(r);
      map.set(r.journal_id, list);
    });
    return map;
  }, [rejections]);

  const withdrawnsByJournal = useMemo(() => {
    if (!withdrawns) return new Map<string, FactWithdrawnRecord[]>();
    const map = new Map<string, FactWithdrawnRecord[]>();
    withdrawns.forEach((w) => {
      if (!w.journal_id) return;
      const list = map.get(w.journal_id) || [];
      list.push(w);
      map.set(w.journal_id, list);
    });
    return map;
  }, [withdrawns]);

  const acceptedByJournal = useMemo(() => {
    if (!accepted) return new Map<string, FactAcceptedRecord[]>();
    const map = new Map<string, FactAcceptedRecord[]>();
    accepted.forEach((a) => {
      if (!a.journal_id) return;
      const list = map.get(a.journal_id) || [];
      list.push(a);
      map.set(a.journal_id, list);
    });
    return map;
  }, [accepted]);

  // Resolve target journal or ambiguous matches from journalSlug
  const slugResolution = useMemo(() => {
    if (!journalSlug || !identityIndex || !journals) {
      return { journalId: null, isAmbiguous: false, ambiguousCandidateIds: [], notFound: false };
    }

    const cleanSlug = decodeURIComponent(journalSlug).trim().toUpperCase();

    // Check if slug is an opaque journal_id route (e.g. "id:sinta:bac57293" or "sinta:bac57293")
    if (cleanSlug.startsWith('ID:')) {
      const rawId = journalSlug.slice(3).trim();
      const match = journals.find((j) => j.journal_id.toLowerCase() === rawId.toLowerCase());
      if (match) return { journalId: match.journal_id, isAmbiguous: false, ambiguousCandidateIds: [], notFound: false };
      return { journalId: null, isAmbiguous: false, ambiguousCandidateIds: [], notFound: true };
    }

    // Check if cleanSlug is a valid ISSN
    if (isValidIssnChecksum(cleanSlug)) {
      if (identityIndex.ambiguousIssns.has(cleanSlug)) {
        const candidateIds = identityIndex.ambiguousIssns.get(cleanSlug) || [];
        return { journalId: null, isAmbiguous: true, ambiguousCandidateIds: candidateIds, notFound: false };
      }
      if (identityIndex.issnToUniqueJournal.has(cleanSlug)) {
        const uniqueId = identityIndex.issnToUniqueJournal.get(cleanSlug)!;
        return { journalId: uniqueId, isAmbiguous: false, ambiguousCandidateIds: [], notFound: false };
      }
      return { journalId: null, isAmbiguous: false, ambiguousCandidateIds: [], notFound: true };
    }

    // Fallback: direct journal_id match
    const directMatch = journals.find((j) => j.journal_id.toLowerCase() === journalSlug.toLowerCase());
    if (directMatch) {
      return { journalId: directMatch.journal_id, isAmbiguous: false, ambiguousCandidateIds: [], notFound: false };
    }

    return { journalId: null, isAmbiguous: false, ambiguousCandidateIds: [], notFound: true };
  }, [journalSlug, identityIndex, journals]);

  // Combined search query
  const effectiveQuery = useMemo(() => {
    return (localSearch || filters.searchQuery || '').trim().toLowerCase();
  }, [localSearch, filters.searchQuery]);

  // Suggestions search: ONLY computed when effectiveQuery has at least 2 characters
  const candidateJournals = useMemo(() => {
    if (!journals || effectiveQuery.length < 2) return [];

    return journals
      .filter((j) => {
        const titleMatch = (j.display_title || '').toLowerCase().includes(effectiveQuery);
        const idMatch = j.journal_id.toLowerCase().includes(effectiveQuery);
        if (titleMatch || idMatch) return true;

        // ISSN search in SINTA
        const s = sintas?.get(j.journal_id);
        if (s) {
          if ((s.p_issn_raw || '').toLowerCase().includes(effectiveQuery)) return true;
          if ((s.e_issn_raw || '').toLowerCase().includes(effectiveQuery)) return true;
          if ((s.p_issn_normalized || '').toLowerCase().includes(effectiveQuery)) return true;
          if ((s.e_issn_normalized || '').toLowerCase().includes(effectiveQuery)) return true;
        }

        // ISSN search in Current DOAJ
        const c = currentByJournal.get(j.journal_id);
        if (c) {
          if ((c.p_issn_raw || '').toLowerCase().includes(effectiveQuery)) return true;
          if ((c.e_issn_raw || '').toLowerCase().includes(effectiveQuery)) return true;
        }

        // ISSN search in Rejections
        const rejList = rejectionsByJournal.get(j.journal_id);
        if (rejList && rejList[0]) {
          if ((rejList[0].p_issn_raw || '').toLowerCase().includes(effectiveQuery)) return true;
          if ((rejList[0].e_issn_raw || '').toLowerCase().includes(effectiveQuery)) return true;
        }

        return false;
      })
      .slice(0, 15);
  }, [journals, effectiveQuery, sintas, currentByJournal, rejectionsByJournal]);

  // Active journal selection (ONLY from slug resolution)
  const activeJournal = useMemo(() => {
    if (!journals || !slugResolution.journalId) return null;
    return journals.find((j) => j.journal_id === slugResolution.journalId) || null;
  }, [slugResolution.journalId, journals]);

  // Associated event records for active journal
  const journalRejections = useMemo(() => {
    if (!activeJournal) return [];
    return rejectionsByJournal.get(activeJournal.journal_id) || [];
  }, [activeJournal, rejectionsByJournal]);

  const journalWithdrawns = useMemo(() => {
    if (!activeJournal) return [];
    return withdrawnsByJournal.get(activeJournal.journal_id) || [];
  }, [activeJournal, withdrawnsByJournal]);

  const journalAccepted = useMemo(() => {
    if (!activeJournal) return [];
    return acceptedByJournal.get(activeJournal.journal_id) || [];
  }, [activeJournal, acceptedByJournal]);

  const activeSinta = useMemo(() => {
    if (!activeJournal || !sintas) return null;
    return sintas.get(activeJournal.journal_id) || null;
  }, [activeJournal, sintas]);

  const activeCurrent = useMemo(() => {
    if (!activeJournal) return null;
    return currentByJournal.get(activeJournal.journal_id) || null;
  }, [activeJournal, currentByJournal]);

  // Ambiguous candidate journals list
  const ambiguousJournals = useMemo(() => {
    if (!slugResolution.isAmbiguous || !journals) return [];
    const idSet = new Set(slugResolution.ambiguousCandidateIds);
    return journals.filter((j) => idSet.has(j.journal_id));
  }, [slugResolution, journals]);

  // Resolve best available ISSNs, publisher, subjects, and verified public URLs
  const sampleRej = journalRejections[0];
  const sampleWith = journalWithdrawns[0];
  const sampleAcc = journalAccepted[0];

  const pIssn =
    activeCurrent?.p_issn_raw ||
    activeSinta?.p_issn_raw ||
    sampleRej?.p_issn_raw ||
    sampleWith?.p_issn_raw ||
    sampleAcc?.p_issn_raw ||
    '—';

  const eIssn =
    activeCurrent?.e_issn_raw ||
    activeSinta?.e_issn_raw ||
    sampleRej?.e_issn_raw ||
    sampleWith?.e_issn_raw ||
    sampleAcc?.e_issn_raw ||
    '—';

  const publisher =
    activeCurrent?.publisher ||
    activeJournal?.current_doaj_publisher ||
    (activeSinta ? 'SINTA Affiliated' : 'Unknown');

  const subjects = activeCurrent?.subjects || [];

  const journalWebUrl =
    activeCurrent?.journal_url ||
    activeSinta?.website_url ||
    sampleRej?.journal_url ||
    sampleWith?.journal_url ||
    sampleAcc?.journal_url;

  const sintaEditorUrl = activeSinta?.editor_url;
  const sintaUrl = activeSinta?.sinta_url;

  const doajProfileUrl =
    activeCurrent?.doaj_profile_url ||
    activeJournal?.current_doaj_profile_url ||
    sampleWith?.doaj_profile_url; // Verified /toc/... URL only

  const currentStatus: CurrentDoajStatus =
    activeJournal?.current_doaj_status ||
    (activeCurrent ? 'currently_indexed' : 'not_found');

  const handleSelectSuggestion = (journalId: string) => {
    if (identityIndex) {
      const slug = identityIndex.journalToCanonicalSlug.get(journalId) || `id:${journalId}`;
      onNavigateToJournal(slug);
    } else {
      onNavigateToJournal(`id:${journalId}`);
    }
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || candidateJournals.length === 0) {
      if (e.key === 'ArrowDown' && candidateJournals.length > 0) {
        setIsDropdownOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < candidateJournals.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : candidateJournals.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < candidateJournals.length) {
        handleSelectSuggestion(candidateJournals[highlightedIndex].journal_id);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleCopyLink = async () => {
    if (!activeJournal) return;
    const path = getJournalProfileRoute(activeJournal.journal_id, identityIndex);
    const fullUrl = `${window.location.origin}${window.location.pathname}${path}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedNotification('Journal profile link copied to clipboard!');
      setTimeout(() => setCopiedNotification(null), 3500);
    } catch {
      setCopiedNotification('Failed to copy automatically. URL: ' + fullUrl);
      setTimeout(() => setCopiedNotification(null), 6000);
    }
  };

  if (error) {
    return <Alert type="warning" title="Error Loading Journal Explorer">{error}</Alert>;
  }

  if (!journals || !rejections || !withdrawns || !accepted || !doajCurrent || !sintas) {
    return <LoadingState message="Loading journal directory..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Back Navigation Bar (shown when viewing a journal or disambiguation) */}
      {(activeJournal || slugResolution.isAmbiguous || slugResolution.notFound) && (
        <BackNavigation onBack={onBack} targetLabel={backTargetLabel} />
      )}

      {/* Route Header */}
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
          Journal Explorer & Verified Dossier
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Search-first directory for Indonesian scholarly journals ({journals.length.toLocaleString()} recognized entities).
          Search by Journal Title, P-ISSN, E-ISSN, or identifier to inspect accreditation, current DOAJ indexing status,
          verified public links, and linked historical review outcomes.
        </p>
      </div>

      {/* Prominent Search Bar with Auto-Suggest Dropdown */}
      <div
        ref={searchBoxRef}
        className="card"
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--white)',
          border: '2px solid var(--warm-black)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
        }}
      >
        <label
          htmlFor="journal-search-input"
          style={{
            display: 'block',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-2)',
            color: 'var(--warm-black)',
          }}
        >
          Search Journal Profile (Title, P-ISSN, E-ISSN, or ID)
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <input
            id="journal-search-input"
            type="search"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              setIsDropdownOpen(e.target.value.trim().length >= 2);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              if (localSearch.trim().length >= 2) {
                setIsDropdownOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search by title, ISSN (e.g. 2252-6617), or identifier..."
            className="input-search"
            autoComplete="off"
            style={{
              flex: 1,
              padding: '12px 16px',
              fontSize: 'var(--text-base)',
              border: '1px solid var(--neutral-border)',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
            }}
          />
          {localSearch && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setLocalSearch('');
                setIsDropdownOpen(false);
              }}
              style={{ padding: '10px 16px', fontSize: 'var(--text-sm)' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Suggestion Dropdown */}
        {isDropdownOpen && effectiveQuery.length >= 2 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 100,
              backgroundColor: 'var(--white)',
              border: '1px solid var(--neutral-border)',
              borderRadius: '0 0 var(--radius-md) var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '320px',
              overflowY: 'auto',
              marginTop: '2px',
            }}
          >
            {candidateJournals.length > 0 ? (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {candidateJournals.map((cand, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <li
                      key={cand.journal_id}
                      onClick={() => handleSelectSuggestion(cand.journal_id)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--light-grey)',
                        cursor: 'pointer',
                        backgroundColor: isHighlighted ? 'var(--sand-light)' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                    >
                      <div style={{ overflow: 'hidden' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 'var(--text-sm)',
                            color: 'var(--warm-black)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {cand.display_title || cand.journal_id}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontFamily: 'var(--font-mono)' }}>
                          Accreditation: {cand.sinta_rank}
                          {cand.in_current_doaj && (
                            <span style={{ color: 'var(--dark-green)', fontWeight: 600, marginLeft: '8px' }}>
                              • Indexed in DOAJ
                            </span>
                          )}
                          {cand.in_rejected && (
                            <span style={{ color: 'var(--sanguine)', fontWeight: 600, marginLeft: '8px' }}>
                              • Rejection History
                            </span>
                          )}
                        </div>
                      </div>
                      <RankBadge rank={cand.sinta_rank} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--dark-grey)', fontSize: 'var(--text-sm)' }}>
                No matching journals found for "<strong>{effectiveQuery}</strong>". Check the spelling or search by ISSN.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Disambiguation Screen: when an ISSN maps to multiple journals */}
      {slugResolution.isAmbiguous && (
        <div
          className="card"
          style={{
            padding: 'var(--space-5)',
            borderLeft: '4px solid var(--ochre)',
            backgroundColor: 'var(--white)',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--warm-black)', marginBottom: 'var(--space-2)' }}>
            Multiple Journals Share ISSN: {decodeURIComponent(journalSlug || '')}
          </h3>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', marginBottom: 'var(--space-4)' }}>
            The requested ISSN is shared across {ambiguousJournals.length} distinct journal entities in the public repository.
            Select the specific journal you wish to inspect below:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {ambiguousJournals.map((cand) => (
              <div
                key={cand.journal_id}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--light-grey)',
                  border: '1px solid var(--neutral-border)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-base)', color: 'var(--warm-black)' }}>
                    {cand.display_title}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginTop: '2px' }}>
                    Publisher: {cand.current_doaj_publisher || 'National Registry'} • SINTA Rank: {cand.sinta_rank}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSelectSuggestion(cand.journal_id)}
                  style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }}
                >
                  View Profile →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not Found Screen */}
      {slugResolution.notFound && (
        <div
          className="card"
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            backgroundColor: 'var(--white)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--neutral-border)',
          }}
        >
          <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--sanguine)', marginBottom: 'var(--space-2)' }}>
            Journal Profile Not Found
          </h3>
          <p style={{ maxWidth: '600px', margin: '0 auto var(--space-4) auto', fontSize: 'var(--text-sm)', color: 'var(--dark-grey)' }}>
            No journal matching identifier or ISSN "<strong>{decodeURIComponent(journalSlug || '')}</strong>" was found in this observatory snapshot.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onBack}
            style={{ padding: '8px 16px', fontSize: 'var(--text-sm)' }}
          >
            ← Back to Journal Search
          </button>
        </div>
      )}

      {/* Main Dossier Presentation */}
      {activeJournal && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Notification Alert for Copied Link */}
          {copiedNotification && (
            <div
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--mid-green)',
                color: 'var(--white)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                borderRadius: 'var(--radius-sm)',
              }}
              role="status"
            >
              ✓ {copiedNotification}
            </div>
          )}

          {/* Top Dossier Card */}
          <div
            className="card"
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--white)',
              borderTop: '4px solid var(--dark-navy)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                borderBottom: '1px solid var(--light-grey)',
                paddingBottom: 'var(--space-3)',
                marginBottom: 'var(--space-3)',
              }}
            >
              <div>
                <h3 style={{ fontSize: 'var(--text-xl)', margin: '0 0 var(--space-1) 0', color: 'var(--warm-black)' }}>
                  {activeJournal.display_title || 'Unnamed Journal'}
                </h3>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 'var(--space-1)' }}>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn btn-secondary"
                    style={{
                      padding: '4px 10px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    title="Copy permanent shareable URL based on ISSN"
                  >
                    <span>🔗</span>
                    <span>Copy Journal Link</span>
                  </button>
                </div>
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                <RankBadge rank={activeJournal.sinta_rank} />
                {currentStatus === 'currently_indexed' && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'var(--dark-green)',
                      color: 'var(--white)',
                      fontWeight: 600,
                    }}
                  >
                    ✓ Currently Indexed in DOAJ
                  </span>
                )}
                {currentStatus === 'not_found' && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'var(--dark-grey)',
                      color: 'var(--white)',
                      fontWeight: 500,
                    }}
                  >
                    Not Indexed in DOAJ
                  </span>
                )}
                {currentStatus === 'requires_review' && (
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'var(--ochre)',
                      color: 'var(--warm-black)',
                      fontWeight: 600,
                    }}
                  >
                    ⚠ Requires Ambiguity Review
                  </span>
                )}
                {activeJournal.in_rejected && <span className="badge badge-rejected">Historical Rejection</span>}
                {activeJournal.in_accepted && (
                  <span className="badge" style={{ backgroundColor: 'var(--dark-navy)', color: 'var(--white)' }}>
                    Historical Acceptance Record
                  </span>
                )}
                {activeJournal.in_withdrawn && <span className="badge badge-withdrawn">Historical Withdrawal</span>}
              </div>
            </div>

            {/* Dossier Attributes Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase' }}>
                  Print ISSN (P-ISSN)
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  {pIssn}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase' }}>
                  Online ISSN (E-ISSN)
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  {eIssn}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase' }}>
                  Publisher
                </span>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  {publisher}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase' }}>
                  SINTA Accreditation
                </span>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginTop: '2px' }}>
                  {activeSinta?.accreditation_raw || activeJournal.sinta_rank}
                </div>
              </div>
            </div>

            {/* Subject classifications if available */}
            {subjects.length > 0 && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase' }}>
                  DOAJ Subjects:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {subjects.map((subj, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: 'var(--light-grey)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--dark-navy)',
                      }}
                    >
                      {subj}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verified Public Action Links */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-2)',
                alignItems: 'center',
                paddingTop: 'var(--space-3)',
                borderTop: '1px solid var(--light-grey)',
              }}
            >
              {journalWebUrl && (
                <a
                  href={journalWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                >
                  Public Journal Website ↗
                </a>
              )}
              {sintaUrl && (
                <a
                  href={sintaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                >
                  SINTA Profile ↗
                </a>
              )}
              {sintaEditorUrl && (
                <a
                  href={sintaEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                >
                  SINTA Editor Team ↗
                </a>
              )}
              {doajProfileUrl ? (
                <a
                  href={doajProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-accent"
                  style={{ padding: '6px 12px', fontSize: 'var(--text-xs)' }}
                >
                  Verified DOAJ Profile (/toc/...) ↗
                </a>
              ) : (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontStyle: 'italic' }}>
                  (No public DOAJ profile link; internal admin routes categorically blocked)
                </span>
              )}
            </div>

            {/* Collapsible Methodology & Provenance Section */}
            <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => setIsProvenanceOpen(!isProvenanceOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--dark-grey)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
              >
                <span>{isProvenanceOpen ? '▼' : '▶'}</span>
                <span>Provenance & Identification Methodology</span>
              </button>

              {isProvenanceOpen && (
                <div
                  style={{
                    marginTop: 'var(--space-2)',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--light-grey)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--warm-black)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div>
                    <strong>Canonical Observatory Route:</strong> {getJournalProfileRoute(activeJournal.journal_id, identityIndex)}
                  </div>
                  <div>
                    <strong>Data Identity Key:</strong> <code style={{ fontFamily: 'var(--font-mono)' }}>{activeJournal.journal_id}</code>
                  </div>
                  <div>
                    <strong>Matching Explanation:</strong> {getMatchingExplanation(sampleRej?.strict_match_status || 'matched', sampleRej?.strict_match_method)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chronological Event Timeline Chart */}
          <JournalEventTimelineChart
            rejections={journalRejections}
            withdrawals={journalWithdrawns}
            accepted={journalAccepted}
            journalTitle={activeJournal.display_title || activeJournal.journal_id}
          />

          {/* Historical Events Detail Table */}
          <div className="card">
            <h4 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-3)' }}>
              Recorded Review & Indexing History (
              {journalRejections.length + journalWithdrawns.length + journalAccepted.length} total records)
            </h4>

            {journalRejections.length === 0 && journalWithdrawns.length === 0 && journalAccepted.length === 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)' }}>
                No historical rejection, withdrawal, or recorded application records attached to this journal identifier.
                {currentStatus === 'currently_indexed' && ' This journal holds active indexing in DOAJ.'}
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
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div>
                      <strong>Rejection Record #{idx + 1}:</strong> {rej.source_record_id}
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginTop: '2px' }}>
                        Match Status: {formatMatchStatus(rej.strict_match_status)} • {formatMatchingMethod(rej.strict_match_method)}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      {rej.event_day || rej.event_at_raw || '—'}
                    </span>
                  </li>
                ))}
                {journalAccepted.map((acc, idx) => (
                  <li
                    key={acc.source_record_id}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      backgroundColor: 'var(--sand-light)',
                      borderLeft: '4px solid var(--dark-navy)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 'var(--text-sm)',
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <div>
                      <strong>Accepted Application Record #{idx + 1}:</strong> {acc.source_record_id}
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginTop: '2px' }}>
                        Database catalog entry date: {acc.added_day || '—'} • Decision date unverified in source
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                      Entry: {acc.added_day || '—'}
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
                      flexWrap: 'wrap',
                      gap: 'var(--space-2)',
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

      {/* Initial Empty State (when no journal or search entered) */}
      {!activeJournal && !slugResolution.isAmbiguous && !slugResolution.notFound && (
        <div
          className="card"
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--dark-grey)',
            backgroundColor: 'var(--white)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--neutral-border)',
          }}
        >
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--warm-black)', marginBottom: 'var(--space-2)' }}>
            Search or select a journal to inspect its complete profile
          </div>
          <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: 'var(--text-sm)' }}>
            Type at least 2 characters of a journal title, ISSN, or identifier above to view suggestions, or navigate from any chart or table across the observatory.
          </p>
        </div>
      )}
    </div>
  );
};
