import React from 'react';
import { SYNTHETIC_REJECTIONS } from '../data/synthetic';
import { RankBadge, Alert } from '../components/common/UIPrimitives';
import { GlobalFilterState } from '../types';

interface RejectedApplicationsPageProps {
  filters: GlobalFilterState;
  onSelectJournal: (journalId: string) => void;
}

export const RejectedApplicationsPage: React.FC<RejectedApplicationsPageProps> = ({
  filters,
  onSelectJournal,
}) => {
  const filteredRecords = React.useMemo(() => {
    return SYNTHETIC_REJECTIONS.filter((rec) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = rec.journal_title.toLowerCase().includes(q);
        const matchIssn =
          rec.p_issn_raw.toLowerCase().includes(q) || rec.e_issn_raw.toLowerCase().includes(q);
        const matchPub = rec.publisher.toLowerCase().includes(q);
        if (!matchTitle && !matchIssn && !matchPub) return false;
      }
      if (filters.sintaRank !== 'all' && rec.sinta_rank !== filters.sintaRank) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const handleExportCSV = () => {
    const headers = [
      'Source Record ID',
      'Journal Title',
      'P-ISSN',
      'E-ISSN',
      'Date Rejected',
      'Publisher',
      'SINTA Rank (as-of 2026-11-15)',
      'Public Journal URL',
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.source_record_id}"`,
      `"${r.journal_title.replace(/"/g, '""')}"`,
      `"${r.p_issn_raw}"`,
      `"${r.e_issn_raw}"`,
      `"${r.date_rejected}"`,
      `"${r.publisher.replace(/"/g, '""')}"`,
      `"${r.sinta_rank}"`,
      `"${r.public_journal_url || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `doaj_rejected_records_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            application event; repeat records for a journal are preserved as distinct rows.
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleExportCSV}>
          Export Filtered CSV ({filteredRecords.length})
        </button>
      </div>

      <Alert type="important" title="Privacy-Safe Link Enforcement">
        Under DOAJ Observatory privacy policy, internal application administration routes
        (e.g. <code>/admin/application/...</code>) are categorically blocked from public exports and links.
        Only validated public journal website URLs and public DOAJ profiles (<code>/toc/...</code>) are exposed.
      </Alert>

      {/* Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            Showing {filteredRecords.length} rejection records
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            Synthetic Test Fixtures (WP2 Scaffold)
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
                <th style={{ padding: 'var(--space-3)' }}>P-ISSN</th>
                <th style={{ padding: 'var(--space-3)' }}>E-ISSN</th>
                <th style={{ padding: 'var(--space-3)' }}>Date Rejected</th>
                <th style={{ padding: 'var(--space-3)' }}>SINTA Rank</th>
                <th style={{ padding: 'var(--space-3)' }}>Publisher</th>
                <th style={{ padding: 'var(--space-3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--dark-grey)' }}>
                    No rejection records match your active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
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
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                      {rec.p_issn_raw || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                      {rec.e_issn_raw || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                      {rec.date_rejected}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <RankBadge rank={rec.sinta_rank} />
                    </td>
                    <td style={{ padding: 'var(--space-3)', color: 'var(--dark-grey)', fontSize: 'var(--text-xs)' }}>
                      {rec.publisher}
                    </td>
                    <td style={{ padding: 'var(--space-3)', whiteSpace: 'nowrap' }}>
                      {rec.public_journal_url ? (
                        <a
                          href={rec.public_journal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 'var(--text-xs)', marginRight: 'var(--space-2)' }}
                        >
                          Journal Web ↗
                        </a>
                      ) : null}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
