import React, { useEffect, useState, useMemo } from 'react';
import { loadFactWithdrawn, loadFactRejected, loadSummary } from '../data/loader';
import { FactWithdrawnRecord, FactRejectedRecord, SummaryPublic, GlobalFilterState } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';
import { formatCurrentDoajStatusBadge, getCurrentDoajStatusSortRank } from '../lib/matchingLabels';
import {
  formatSintaRankLabel,
  getSintaRankTooltipDescription,
  getSintaRankColor,
  createCategoricalAxisLabelConfig,
  createCategoricalGridConfig,
} from '../lib/chartAxisConfig';
import { BaseEChart } from '../components/charts/BaseEChart';
import * as echarts from '../lib/echarts';

interface WithdrawnJournalsPageProps {
  filters: GlobalFilterState;
  onSelectJournal: (journalId: string) => void;
}

export const WithdrawnJournalsPage: React.FC<WithdrawnJournalsPageProps> = ({
  filters,
  onSelectJournal,
}) => {
  const [withdrawn, setWithdrawn] = useState<FactWithdrawnRecord[] | null>(null);
  const [rejected, setRejected] = useState<FactRejectedRecord[]>([]);
  const [summary, setSummary] = useState<SummaryPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  useEffect(() => {
    Promise.all([loadFactWithdrawn(), loadFactRejected(), loadSummary()])
      .then(([wData, rData, sData]) => {
        setWithdrawn(wData);
        setRejected(rData);
        setSummary(sData);
      })
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

  // Visual Analytics Computations
  const withdrawnAnalytics = useMemo(() => {
    // 1. Annual Withdrawal Trends (2022 to 2026)
    const years = [2022, 2023, 2024, 2025, 2026].filter(
      (y) => y >= filters.yearRange[0] && y <= filters.yearRange[1]
    );
    const annualCounts = years.map(
      (y) => filteredWithdrawn.filter((w) => w.last_withdrawn_year === y).length
    );

    // 2. SINTA Rank Distribution
    const hasAmbiguous = filteredWithdrawn.some(
      (w) => (filters.matchingMode === 'extended' ? w.extended_sinta_rank : w.sinta_rank) === 'ambiguous'
    );
    const rankOrder = hasAmbiguous
      ? ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched', 'ambiguous']
      : ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched'];
    const rankCounts: Record<string, number> = {};
    for (const w of filteredWithdrawn) {
      const rnk = filters.matchingMode === 'extended' ? w.extended_sinta_rank : w.sinta_rank;
      rankCounts[rnk] = (rankCounts[rnk] || 0) + 1;
    }

    // 3. Rejected/Withdrawn Overlap Visualization
    const rejectedJournalIds = new Set(
      rejected.map((r) => filters.matchingMode === 'extended' ? (r.extended_journal_id || r.journal_id) : r.journal_id).filter(Boolean)
    );
    let withRejectionCount = 0;
    let withoutRejectionCount = 0;
    for (const w of filteredWithdrawn) {
      const wId = filters.matchingMode === 'extended' ? (w.extended_journal_id || w.journal_id) : w.journal_id;
      if (wId && rejectedJournalIds.has(wId)) {
        withRejectionCount++;
      } else {
        withoutRejectionCount++;
      }
    }

    return {
      years,
      annualCounts,
      rankOrder,
      rankCounts,
      withRejectionCount,
      withoutRejectionCount,
    };
  }, [filteredWithdrawn, rejected, filters.matchingMode, filters.yearRange]);

  // Chart 1: Annual Withdrawal Trend Bar Chart
  const annualTrendOptions: echarts.EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: withdrawnAnalytics.years.map(String),
        axisLabel: createCategoricalAxisLabelConfig({ rotate: 0, fontSize: 11 }),
      },
      yAxis: {
        type: 'value',
        name: 'Withdrawals',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      series: [
        {
          name: 'Withdrawn Records',
          type: 'bar',
          data: withdrawnAnalytics.annualCounts,
          itemStyle: { color: '#3A5959' }, // --dark-green
          label: {
            show: true,
            position: 'top',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          },
        },
      ],
    };
  }, [withdrawnAnalytics.years, withdrawnAnalytics.annualCounts]);

  // Chart 2: SINTA Rank Distribution
  const rankDistOptions: echarts.EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const rankKey = withdrawnAnalytics.rankOrder[item.dataIndex] || item.name;
          const desc = getSintaRankTooltipDescription(rankKey);
          const pct = filteredWithdrawn.length > 0 ? ((item.value / filteredWithdrawn.length) * 100).toFixed(1) : '0';
          return `<div style="font-weight:700;">${desc}</div>
            <div style="font-family:var(--font-mono);font-size:12px;margin-top:2px;">
              Withdrawals: <strong>${item.value.toLocaleString()}</strong> records (${pct}%)
            </div>`;
        },
      },
      grid: createCategoricalGridConfig({ left: '4%', right: '4%', top: '10%', bottom: '16%' }),
      xAxis: {
        type: 'category',
        data: withdrawnAnalytics.rankOrder.map(formatSintaRankLabel),
        axisLabel: createCategoricalAxisLabelConfig({ rotate: 0, fontSize: 11 }),
      },
      yAxis: {
        type: 'value',
        name: 'Records',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      series: [
        {
          name: 'Withdrawals',
          type: 'bar',
          data: withdrawnAnalytics.rankOrder.map((rnk) => ({
            value: withdrawnAnalytics.rankCounts[rnk] || 0,
            itemStyle: { color: getSintaRankColor(rnk) },
          })),
          label: {
            show: true,
            position: 'top',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          },
        },
      ],
    };
  }, [withdrawnAnalytics.rankOrder, withdrawnAnalytics.rankCounts, filteredWithdrawn.length]);

  // Chart 3: Overlap with Rejection Records Donut
  const overlapOptions: echarts.EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <strong>{c}</strong> records ({d}%)',
      },
      legend: {
        bottom: 0,
        textStyle: { fontFamily: 'var(--font-sans)', fontSize: 12 },
      },
      series: [
        {
          name: 'Rejection Record History',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 11,
            fontFamily: 'var(--font-sans)',
          },
          data: [
            {
              name: 'Also Has Rejection Records',
              value: withdrawnAnalytics.withRejectionCount,
              itemStyle: { color: '#FD5A3B' }, // --grapefruit
            },
            {
              name: 'No Rejection Records Recorded',
              value: withdrawnAnalytics.withoutRejectionCount,
              itemStyle: { color: '#3A5959' }, // --dark-green
            },
          ],
        },
      ],
    };
  }, [withdrawnAnalytics.withRejectionCount, withdrawnAnalytics.withoutRejectionCount]);

  const withdrawnSortAccessors = useMemo(() => ({
    id: (record: FactWithdrawnRecord) => record.source_record_id,
    title: (record: FactWithdrawnRecord) => record.journal_title,
    issn: (record: FactWithdrawnRecord) => `${record.p_issn_raw} ${record.e_issn_raw}`,
    withdrawn: (record: FactWithdrawnRecord) => record.last_withdrawn_day,
    reinstated: (record: FactWithdrawnRecord) => record.last_reinstated_day,
    rank: (record: FactWithdrawnRecord) => filters.matchingMode === 'extended' ? record.extended_sinta_rank : record.sinta_rank,
    currentStatus: (record: FactWithdrawnRecord) => getCurrentDoajStatusSortRank(record.current_doaj_status),
  }), [filters.matchingMode]);

  const { sortedItems: sortedWithdrawn, sortKey, direction, requestSort } = useSortableData(
    filteredWithdrawn, withdrawnSortAccessors, 'withdrawn', 'desc',
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortKey, direction]);

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
    return <LoadingState message="Loading verified DOAJ withdrawal records..." />;
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
          Route 4 • Historical Delisting & Overlap Analysis
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Withdrawn Journals Observatory
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Indonesian journals recorded in the DOAJ Last Withdrawn dataset (2022–2026). Captures annual delisting trends,
          accreditation tier compositions, overlap with application rejection histories, and recorded returns to DOAJ (all 661 authoritative source rows conserved).
        </p>
      </div>

      <Alert type="important" title="Status Interpretation Safeguard">
        A record in the historical withdrawal dataset documents a past withdrawal event.
        It must <strong>never</strong> be reported as 'currently withdrawn from DOAJ' without referencing the
        current DOAJ index snapshot (15 November 2026), as journals may have subsequently returned to DOAJ
        ({reinstatedCount} source record documents a recorded return date).
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
            Recorded Returns to DOAJ
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {reinstatedCount.toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Historical source annotation</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--dark-navy)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Accepted → Withdrawn
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {(summary?.lifecycle_summary?.verified_a_to_w_journals || 123).toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Dated acceptance preceding withdrawal</span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--mid-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Withdrawn → Accepted
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {(summary?.lifecycle_summary?.verified_w_to_a_journals || 29).toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            Median: {summary?.lifecycle_summary?.time_to_acceptance_stats?.withdrawal_to_acceptance_journal?.median || 541} days to return
          </span>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warm-black)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', fontWeight: 600 }}>
            Accepted → Withdrawn → Accepted
          </span>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', fontWeight: 700, margin: '4px 0' }}>
            {(summary?.lifecycle_summary?.verified_a_w_a_journals || 7).toLocaleString()}
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Verified three-phase lifecycle pattern</span>
        </div>
      </div>

      {/* Visual Analytics Row: Annual Trends, Rank Distribution, and Rejection Overlap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
        <BaseEChart
          title="Annual Withdrawal Record Volume"
          metricLabel="Annual Withdrawals"
          unit="records"
          denominatorNote={`${filteredWithdrawn.length.toLocaleString()} active records`}
          scopeNote={`Filtered years: ${filters.yearRange[0]}–${filters.yearRange[1]}`}
          options={annualTrendOptions}
          ariaLabel="Bar chart of annual withdrawal volumes"
        />

        <BaseEChart
          title="Withdrawn Journals by Accreditation Tier"
          metricLabel="Withdrawals by SINTA Tier"
          unit="records"
          denominatorNote={`${filteredWithdrawn.length.toLocaleString()} active records`}
          scopeNote={`Mode: ${filters.matchingMode.toUpperCase()}`}
          options={rankDistOptions}
          ariaLabel="Bar chart of withdrawn journals across national accreditation tiers"
        />

        <BaseEChart
          title="Overlap with DOAJ Rejection History"
          metricLabel="Rejection History Cross-Over"
          unit="records"
          denominatorNote={`${filteredWithdrawn.length.toLocaleString()} active records`}
          scopeNote="Journals present in both Withdrawn and Rejected sets"
          options={overlapOptions}
          ariaLabel="Donut chart showing overlap between withdrawn journals and rejection records"
        />
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
                <SortableHeader columnKey="title" label="Journal Title" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="issn" label="P-ISSN / E-ISSN" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="withdrawn" label="Withdrawal Date" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="reinstated" label="Recorded Return Date" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="rank" label="SINTA Rank" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="currentStatus" label="Current DOAJ Status" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <th style={{ padding: 'var(--space-3)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--dark-grey)' }}>
                    No withdrawal records match your active filter criteria.
                  </td>
                </tr>
              ) : (
                pagedRecords.map((rec) => {
                const effectiveRank = filters.matchingMode === 'extended' ? rec.extended_sinta_rank : rec.sinta_rank;
                const effectiveJournalId = filters.matchingMode === 'extended' && rec.extended_match_status === 'matched'
                  ? rec.extended_journal_id || rec.journal_id
                  : rec.journal_id;

                return (
                  <tr key={rec.source_record_id} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                    <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>
                      {effectiveJournalId ? (
                        <button
                          type="button"
                          onClick={() => onSelectJournal(effectiveJournalId)}
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
                        <span className="badge badge-sinta" title="Recorded Return to DOAJ annotation in source">
                          {rec.last_reinstated_day || rec.last_reinstated_date_raw}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--dark-grey)', fontStyle: 'italic' }}>None recorded</span>
                      )}
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      <RankBadge rank={effectiveRank} />
                    </td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      {(() => {
                        const statusInfo = formatCurrentDoajStatusBadge(rec.current_doaj_status);
                        return (
                          <span className={`badge ${statusInfo.badgeClass}`} style={statusInfo.style}>
                            {statusInfo.label}
                          </span>
                        );
                      })()}
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
                      {effectiveJournalId && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', minHeight: '30px', fontSize: 'var(--text-xs)' }}
                          onClick={() => onSelectJournal(effectiveJournalId)}
                        >
                          Profile
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
