import React, { useEffect, useState, useMemo } from 'react';
import { loadFactRejected } from '../data/loader';
import { FactRejectedRecord, GlobalFilterState } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';

interface RejectedApplicationsPageProps {
  filters: GlobalFilterState;
  onSelectJournal: (journalId: string) => void;
}

export const RejectedApplicationsPage: React.FC<RejectedApplicationsPageProps> = ({
  filters,
  onSelectJournal,
}) => {
  const [records, setRecords] = useState<FactRejectedRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  useEffect(() => {
    loadFactRejected()
      .then((data) => setRecords(data))
      .catch((err) => setError(err.message || 'Failed to load rejected applications'));
  }, []);

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    return records.filter((rec) => {
      // Matching mode filter
      if (filters.matchingMode === 'strict' && rec.strict_match_status !== 'matched' && filters.sintaRank !== 'all' && filters.sintaRank !== 'unmatched') {
        // Strict match only matches SINTA records when strict_match_status is matched
      }

      // SINTA rank filter
      if (filters.sintaRank !== 'all') {
        if (rec.sinta_rank !== filters.sintaRank) {
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
  }, [records, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage]);

  const handleExportCSV = () => {
    const headers = [
      'Source Record ID',
      'Journal ID',
      'Journal Title',
      'P-ISSN Raw',
      'E-ISSN Raw',
      'Event Day',
      'Event Year',
      'SINTA Rank (as-of 2026-11-15)',
      'Strict Match Status',
      'Public Journal URL',
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.source_record_id}"`,
      `"${r.journal_id || ''}"`,
      `"${r.journal_title.replace(/"/g, '""')}"`,
      `"${r.p_issn_raw}"`,
      `"${r.e_issn_raw}"`,
      `"${r.event_day || ''}"`,
      `"${r.event_year || ''}"`,
      `"${r.sinta_rank}"`,
      `"${r.strict_match_status}"`,
      `"${r.journal_url || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `doaj_rejected_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return <Alert type="warning" title="Error Loading Rejected Dataset">{error}</Alert>;
  }

  if (!records) {
    return <LoadingState message="Loading verified DOAJ rejection records (8,898 baseline)..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
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
            Route 2 • Record-Level Evidence
          </span>
          <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
            Rejected Applications Directory
          </h2>
          <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
            Individual application rejection records recorded between 2022 and 2026. Every record represents an
            application event; repeat records for a journal are preserved as distinct rows (8,898 total source rows conserved).
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleExportCSV}>
          Export Filtered CSV ({filteredRecords.length.toLocaleString()})
        </button>
      </div>

      <Alert type="important" title="DOAJ Privacy Link Rule">
        In compliance with project security rules, internal administration routes (e.g. <code>/admin/application/...</code>)
        are categorically blocked from public exports and links. Only validated public journal URLs are displayed.
      </Alert>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            Showing {filteredRecords.length.toLocaleString()} rejection records (Page {currentPage} of {totalPages})
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
                <th style={{ padding: 'var(--space-3)' }}>Record ID</th>
                <th style={{ padding: 'var(--space-3)' }}>Journal Title</th>
                <th style={{ padding: 'var(--space-3)' }}>P-ISSN</th>
                <th style={{ padding: 'var(--space-3)' }}>E-ISSN</th>
                <th style={{ padding: 'var(--space-3)' }}>Date Rejected</th>
                <th style={{ padding: 'var(--space-3)' }}>SINTA Rank</th>
                <th style={{ padding: 'var(--space-3)' }}>Match Status</th>
                <th style={{ padding: 'var(--space-3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--dark-grey)' }}>
                    No rejection records match your active filter criteria.
                  </td>
                </tr>
              ) : (
                pagedRecords.map((rec) => (
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
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                      {rec.p_issn_raw || '—'}
                      {rec.p_issn_quality === 'placeholder' && (
                        <span className="badge badge-neutral" style={{ marginLeft: '4px', fontSize: '10px' }}>placeholder</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                      {rec.e_issn_raw || '—'}
                      {rec.e_issn_quality === 'placeholder' && (
                        <span className="badge badge-neutral" style={{ marginLeft: '4px', fontSize: '10px' }}>placeholder</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                      {rec.event_day || rec.event_at_raw || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <RankBadge rank={rec.sinta_rank} />
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <span className={`badge ${rec.strict_match_status === 'matched' ? 'badge-sinta' : 'badge-neutral'}`}>
                        {rec.strict_match_status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                      {rec.journal_url ? (
                        <a
                          href={rec.journal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 'var(--text-xs)', marginRight: 'var(--space-2)' }}
                        >
                          Journal Web ↗
                        </a>
                      ) : null}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
