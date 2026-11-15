import React, { useEffect, useState, useMemo } from 'react';
import { loadRejectionHistory, loadDimJournals, loadSummary } from '../data/loader';
import { RejectionHistoryRecord, DimJournalRecord, SummaryPublic, GlobalFilterState } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';

interface RejectionHistoryPageProps {
  filters: GlobalFilterState;
  onSelectJournal: (journalId: string) => void;
}

export const RejectionHistoryPage: React.FC<RejectionHistoryPageProps> = ({
  filters,
  onSelectJournal,
}) => {
  const [history, setHistory] = useState<RejectionHistoryRecord[] | null>(null);
  const [dimJournals, setDimJournals] = useState<Map<string, DimJournalRecord> | null>(null);
  const [summary, setSummary] = useState<SummaryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  useEffect(() => {
    Promise.all([loadRejectionHistory(), loadDimJournals(), loadSummary()])
      .then(([hist, dims, summ]) => {
        setHistory(hist);
        const map = new Map<string, DimJournalRecord>();
        dims.forEach((d) => map.set(d.journal_id, d));
        setDimJournals(map);
        setSummary(summ);
      })
      .catch((err) => setError(err.message || 'Failed to load rejection history'));
  }, []);

  const filteredHistory = useMemo(() => {
    if (!history || !dimJournals) return [];
    return history.filter((h) => {
      if (filters.eventKind === 'withdrawn') return false;
      if (!h.event_years.some((year) => year >= filters.yearRange[0] && year <= filters.yearRange[1])) return false;
      const dim = dimJournals.get(h.journal_id);
      const title = dim ? dim.display_title.toLowerCase() : '';
      const rank = dim ? dim.sinta_rank : 'unmatched';

      // SINTA rank filter
      if (filters.sintaRank !== 'all') {
        if (rank !== filters.sintaRank) {
          return false;
        }
      }

      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = title.includes(q);
        const matchId = h.journal_id.toLowerCase().includes(q);
        if (!matchTitle && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [history, dimJournals, filters]);

  const historySortAccessors = useMemo(() => ({
    journal: (item: RejectionHistoryRecord) => dimJournals?.get(item.journal_id)?.display_title || item.journal_id,
    rank: (item: RejectionHistoryRecord) => dimJournals?.get(item.journal_id)?.sinta_rank || 'unmatched',
    records: (item: RejectionHistoryRecord) => item.source_record_count,
    days: (item: RejectionHistoryRecord) => item.distinct_event_day_count,
    years: (item: RejectionHistoryRecord) => item.distinct_event_year_count,
    dates: (item: RejectionHistoryRecord) => item.event_days[item.event_days.length - 1] || '',
    gaps: (item: RejectionHistoryRecord) => item.consecutive_day_gaps[item.consecutive_day_gaps.length - 1] ?? -1,
  }), [dimJournals]);
  const { sortedItems: sortedHistory, sortKey, direction, requestSort } = useSortableData(
    filteredHistory, historySortAccessors, 'dates', 'desc',
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(sortedHistory.length / pageSize) || 1;
  const pagedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedHistory.slice(start, start + pageSize);
  }, [sortedHistory, currentPage]);

  if (error) {
    return <Alert type="warning" title="Error Loading Rejection History">{error}</Alert>;
  }

  if (!history || !dimJournals || !summary) {
    return <LoadingState message="Loading rejection recurrence and chronology data (5,754 journals)..." />;
  }

  // Frequency distribution from verified histogram in summary_public.json
  const hist = summary.repeat_record_histogram;
  const singleCount = hist['1'] || 0;
  const twoCount = hist['2'] || 0;
  const threeCount = hist['3'] || 0;
  const fourPlusCount = Object.entries(hist)
    .filter(([k]) => parseInt(k, 10) >= 4)
    .reduce((sum, [, count]) => sum + count, 0);

  const totalJournals = summary.identity_counts.rejected_resolved_journals; // 5,754

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

      <Alert type="note" title="Analytical Rigor: Records vs Decisions">
        Multiple rejection records attached to a journal identifier document sequential procedural events
        ({summary.repeat_record_journals.toLocaleString()} journals have ≥2 records; {summary.repeat_date_journals.toLocaleString()} on distinct dates).
        They do not automatically imply intentional re-applications or editorial misconduct.
      </Alert>

      {/* Frequency Distribution Summary Cards (Verified Invariants) */}
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
            {singleCount.toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            {((singleCount / totalJournals) * 100).toFixed(1)}% of rejected journals
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--grapefruit)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Two Rejections (2x)
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {twoCount.toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            {((twoCount / totalJournals) * 100).toFixed(1)}% of rejected journals
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--salmon)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Three Rejections (3x)
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {threeCount.toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            {((threeCount / totalJournals) * 100).toFixed(1)}% of rejected journals
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warm-black)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Four+ Rejections (≥4x)
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {fourPlusCount.toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            {((fourPlusCount / totalJournals) * 100).toFixed(1)}% high-recurrence journals
          </span>
        </div>
      </div>

      {/* Recurrence Directory Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            Showing {filteredHistory.length.toLocaleString()} journals with rejection histories (Page {currentPage} of {totalPages})
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 10px', minHeight: '32px', fontSize: 'var(--text-xs)' }}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '4px 10px', minHeight: '32px', fontSize: 'var(--text-xs)' }}
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
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
                <SortableHeader columnKey="journal" label="Journal Identifier & Title" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="rank" label="SINTA Rank" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="records" label="Total Records" activeKey={sortKey} direction={direction} onSort={requestSort} align="center" />
                <SortableHeader columnKey="days" label="Distinct Days" activeKey={sortKey} direction={direction} onSort={requestSort} align="center" />
                <SortableHeader columnKey="years" label="Span Years" activeKey={sortKey} direction={direction} onSort={requestSort} align="center" />
                <SortableHeader columnKey="dates" label="Event Dates" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="gaps" label="Day Gaps" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <th style={{ padding: 'var(--space-3)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedHistory.map((h) => {
                const dim = dimJournals.get(h.journal_id);
                const title = dim ? dim.display_title : 'Unknown Title';
                const rank = dim ? dim.sinta_rank : 'unmatched';

                return (
                  <tr key={h.journal_id} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                      <button
                        type="button"
                        onClick={() => onSelectJournal(h.journal_id)}
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
                        {title}
                      </button>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontFamily: 'var(--font-mono)' }}>
                        {h.journal_id}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <RankBadge rank={rank} />
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '28px',
                          height: '28px',
                          padding: '0 6px',
                          borderRadius: '14px',
                          backgroundColor: h.source_record_count > 1 ? 'var(--sanguine-10)' : 'var(--warm-black-05)',
                          color: h.source_record_count > 1 ? 'var(--sanguine)' : 'var(--warm-black)',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {h.source_record_count}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {h.distinct_event_day_count}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                      {h.distinct_event_year_count}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '300px' }}>
                        {h.event_days.slice(0, 4).map((d, idx) => (
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
                            {d}
                          </span>
                        ))}
                        {h.event_days.length > 4 && (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
                            +{h.event_days.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                      {h.consecutive_day_gaps.length > 0 ? (
                        <span>{h.consecutive_day_gaps.join(', ')}d</span>
                      ) : (
                        <span style={{ color: 'var(--dark-grey)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', minHeight: '30px', fontSize: 'var(--text-xs)' }}
                        onClick={() => onSelectJournal(h.journal_id)}
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
