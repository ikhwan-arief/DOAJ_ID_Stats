import React, { useEffect, useState, useMemo } from 'react';
import { loadFactWithdrawn } from '../data/loader';
import { FactWithdrawnRecord, GlobalFilterState } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';

interface WithdrawnJournalsPageProps {
  filters: GlobalFilterState;
  onSelectJournal: (journalId: string) => void;
}

export const WithdrawnJournalsPage: React.FC<WithdrawnJournalsPageProps> = ({
  filters,
  onSelectJournal,
}) => {
  const [withdrawn, setWithdrawn] = useState<FactWithdrawnRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  useEffect(() => {
    loadFactWithdrawn()
      .then((data) => setWithdrawn(data))
      .catch((err) => setError(err.message || 'Failed to load withdrawn dataset'));
  }, []);

  const filteredWithdrawn = useMemo(() => {
    if (!withdrawn) return [];
    return withdrawn.filter((rec) => {
      if (filters.eventKind === 'rejected') return false;
      if (rec.last_withdrawn_year !== null && (rec.last_withdrawn_year < filters.yearRange[0] || rec.last_withdrawn_year > filters.yearRange[1])) return false;
      const effectiveRank = filters.matchingMode === 'extended' ? rec.extended_sinta_rank : rec.sinta_rank;
      // SINTA rank filter
      if (filters.sintaRank !== 'all') {
        if (effectiveRank !== filters.sintaRank) {
          return false;
        }
      }

      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = rec.journal_title.toLowerCase().includes(q);
        const matchPIssn = rec.p_issn_raw?.toLowerCase().includes(q) || false;
        const matchEIssn = rec.e_issn_raw?.toLowerCase().includes(q) || false;
        const matchId = rec.source_record_id.toLowerCase().includes(q);
        if (!matchTitle && !matchPIssn && !matchEIssn && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [withdrawn, filters]);

  const withdrawnSortAccessors = useMemo(() => ({
    id: (record: FactWithdrawnRecord) => record.source_record_id,
    title: (record: FactWithdrawnRecord) => record.journal_title,
    issn: (record: FactWithdrawnRecord) => `${record.p_issn_raw} ${record.e_issn_raw}`,
    withdrawn: (record: FactWithdrawnRecord) => record.last_withdrawn_day,
    reinstated: (record: FactWithdrawnRecord) => record.last_reinstated_day,
    rank: (record: FactWithdrawnRecord) => filters.matchingMode === 'extended' ? record.extended_sinta_rank : record.sinta_rank,
    profile: (record: FactWithdrawnRecord) => record.doaj_profile_url || '',
  }), [filters.matchingMode]);
  const { sortedItems: sortedWithdrawn, sortKey, direction, requestSort } = useSortableData(
    filteredWithdrawn, withdrawnSortAccessors, 'withdrawn', 'desc',
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(sortedWithdrawn.length / pageSize) || 1;
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedWithdrawn.slice(start, start + pageSize);
  }, [sortedWithdrawn, currentPage]);

  const reinstatedCount = useMemo(() => {
    if (!withdrawn) return 0;
    return withdrawn.filter((w) => Boolean(w.last_reinstated_date_raw)).length;
  }, [withdrawn]);

  if (error) {
    return <Alert type="warning" title="Error Loading Withdrawn Dataset">{error}</Alert>;
  }

  if (!withdrawn) {
    return <LoadingState message="Loading verified DOAJ withdrawal records (570 baseline)..." />;
  }

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
          reinstatement records where present, and intersection with current national accreditation rankings (570 total source rows conserved).
        </p>
      </div>

      <Alert type="important" title="Status Interpretation Safeguard">
        A record in the historical withdrawal dataset documents a past withdrawal event.
        It must <strong>never</strong> be reported as 'currently withdrawn from DOAJ' without live,
        real-time verification against the live DOAJ index, as journals may have been subsequently reinstated
        ({reinstatedCount} source records document reinstatement dates).
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
            {withdrawn.length.toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Baseline source rows (100% conserved)</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--mid-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Strict SINTA Matches
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {withdrawn.filter((w) => w.strict_match_status === 'matched').length.toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            {((withdrawn.filter((w) => w.strict_match_status === 'matched').length / withdrawn.length) * 100).toFixed(1)}% matched to SINTA
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--yellow)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Recorded Reinstatements
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {reinstatedCount.toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Source contains Last Reinstated Date</span>
        </div>
      </div>

      {/* Withdrawn Records Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            Showing {filteredWithdrawn.length.toLocaleString()} withdrawn journal records (Page {currentPage} of {totalPages})
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
                <SortableHeader columnKey="id" label="Record ID" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="title" label="Journal Title" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="issn" label="P-ISSN / E-ISSN" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="withdrawn" label="Withdrawal Date" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="reinstated" label="Reinstatement Date" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="rank" label="SINTA Rank" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="profile" label="Public Profile" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <th style={{ padding: 'var(--space-3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.map((rec) => (
                <tr key={rec.source_record_id} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                  <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
                    {rec.source_record_id}
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                    {rec.journal_id ? (
                      <button
                        type="button"
                        onClick={() => onSelectJournal(rec.journal_id!)}
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
                    ) : (
                      <span>{rec.journal_title}</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    <div>P: {rec.p_issn_raw || '—'}</div>
                    <div>E: {rec.e_issn_raw || '—'}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                    {rec.last_withdrawn_day || rec.last_withdrawn_date_raw || '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                    {rec.last_reinstated_date_raw ? (
                      <span className="badge badge-sinta">{rec.last_reinstated_day || rec.last_reinstated_date_raw}</span>
                    ) : (
                      <span style={{ color: 'var(--dark-grey)', fontStyle: 'italic' }}>None recorded</span>
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <RankBadge rank={filters.matchingMode === 'extended' ? rec.extended_sinta_rank : rec.sinta_rank} />
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
                  <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                    {rec.journal_url && (
                      <a
                        href={rec.journal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 'var(--text-xs)', marginRight: 'var(--space-2)' }}
                      >
                        Website ↗
                      </a>
                    )}
                    {rec.journal_id && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '2px 8px', minHeight: '30px', fontSize: 'var(--text-xs)' }}
                        onClick={() => onSelectJournal(rec.journal_id!)}
                      >
                        Profile
                      </button>
                    )}
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
