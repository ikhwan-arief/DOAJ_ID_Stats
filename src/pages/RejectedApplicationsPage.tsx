import React, { useEffect, useState, useMemo } from 'react';
import { loadFactRejected } from '../data/loader';
import { FactRejectedRecord, GlobalFilterState } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';
import { BaseEChart } from '../components/charts/BaseEChart';
import * as echarts from '../lib/echarts';

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
      if (filters.eventKind === 'withdrawn') return false;
      if (rec.event_year !== null && (rec.event_year < filters.yearRange[0] || rec.event_year > filters.yearRange[1])) return false;
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
  }, [records, filters]);

  // Visual Analytics Computations
  const analyticsData = useMemo(() => {
    // 1. Monthly Trends
    const monthCounts: Record<string, number> = {};
    for (const r of filteredRecords) {
      if (r.event_month) {
        monthCounts[r.event_month] = (monthCounts[r.event_month] || 0) + 1;
      }
    }
    const sortedMonths = Object.keys(monthCounts).sort();

    // 2. SINTA Rank Distribution
    const rankOrder = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched'];
    const rankCounts: Record<string, number> = {};
    for (const r of filteredRecords) {
      const rnk = filters.matchingMode === 'extended' ? r.extended_sinta_rank : r.sinta_rank;
      rankCounts[rnk] = (rankCounts[rnk] || 0) + 1;
    }

    // 3. Year-by-Rank Heatmap
    const years = [2022, 2023, 2024, 2025, 2026].filter(
      (y) => y >= filters.yearRange[0] && y <= filters.yearRange[1]
    );
    const heatmapMatrix: Array<[number, number, number]> = []; // [yearIdx, rankIdx, count]
    let maxHeatmapVal = 0;

    years.forEach((y, yIdx) => {
      rankOrder.forEach((rnk, rIdx) => {
        const count = filteredRecords.filter((r) => {
          const effectiveRank = filters.matchingMode === 'extended' ? r.extended_sinta_rank : r.sinta_rank;
          return r.event_year === y && effectiveRank === rnk;
        }).length;
        if (count > maxHeatmapVal) maxHeatmapVal = count;
        heatmapMatrix.push([yIdx, rIdx, count]);
      });
    });

    return {
      sortedMonths,
      monthCounts,
      rankOrder,
      rankCounts,
      years,
      heatmapMatrix,
      maxHeatmapVal,
    };
  }, [filteredRecords, filters.matchingMode, filters.yearRange]);

  // Chart 1: Monthly Timeline Options
  const monthlyTrendOptions: echarts.EChartsOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
      },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: analyticsData.sortedMonths,
        axisLabel: {
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          rotate: analyticsData.sortedMonths.length > 24 ? 45 : 0,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Applications',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      series: [
        {
          name: 'Rejected Applications',
          type: 'line',
          smooth: true,
          data: analyticsData.sortedMonths.map((m) => analyticsData.monthCounts[m]),
          itemStyle: { color: '#982E0A' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(152, 46, 10, 0.4)' },
              { offset: 1, color: 'rgba(152, 46, 10, 0.05)' },
            ]),
          },
        },
      ],
    };
  }, [analyticsData.sortedMonths, analyticsData.monthCounts]);

  // Chart 2: SINTA Rank Distribution Bar
  const rankDistOptions: echarts.EChartsOption = useMemo(() => {
    const getRankColor = (rank: string) => {
      switch (rank) {
        case 'S1': return '#1B4D3E';
        case 'S2': return '#2E6F56';
        case 'S3': return '#47A178';
        case 'S4': return '#3A5959';
        case 'S5': return '#8C6D31';
        case 'S6': return '#735338';
        case 'NA': return '#5C5956';
        default: return '#7E7A75';
      }
    };

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const pct = filteredRecords.length > 0 ? ((item.value / filteredRecords.length) * 100).toFixed(1) : '0';
          return `${item.name}: <strong>${item.value.toLocaleString()}</strong> records (${pct}%)`;
        },
      },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: analyticsData.rankOrder,
        axisLabel: { fontFamily: 'var(--font-mono)', fontWeight: 600 },
      },
      yAxis: {
        type: 'value',
        name: 'Records',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      series: [
        {
          name: 'Applications',
          type: 'bar',
          data: analyticsData.rankOrder.map((rnk) => ({
            value: analyticsData.rankCounts[rnk] || 0,
            itemStyle: { color: getRankColor(rnk) },
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
  }, [analyticsData.rankOrder, analyticsData.rankCounts, filteredRecords.length]);

  // Chart 3: Year-by-Rank Heatmap
  const heatmapOptions: echarts.EChartsOption = useMemo(() => {
    return {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [yIdx, rIdx, val] = params.data;
          const year = analyticsData.years[yIdx];
          const rank = analyticsData.rankOrder[rIdx];
          return `${year} • SINTA ${rank}: <strong>${val.toLocaleString()}</strong> rejections`;
        },
      },
      grid: { left: '8%', right: '5%', top: '8%', bottom: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: analyticsData.years.map(String),
        splitArea: { show: true },
        axisLabel: { fontFamily: 'var(--font-mono)', fontWeight: 600 },
      },
      yAxis: {
        type: 'category',
        data: analyticsData.rankOrder,
        splitArea: { show: true },
        axisLabel: { fontFamily: 'var(--font-mono)', fontWeight: 600 },
      },
      visualMap: {
        min: 0,
        max: analyticsData.maxHeatmapVal || 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#F6F4F4', '#FA9A87', '#FD5A3B', '#982E0A'],
        },
        textStyle: { fontFamily: 'var(--font-mono)', fontSize: 11 },
      },
      series: [
        {
          name: 'Rejections by Year and Rank',
          type: 'heatmap',
          data: analyticsData.heatmapMatrix,
          label: {
            show: true,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: '#282624',
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
  }, [analyticsData]);

  const rejectedSortAccessors = useMemo(() => ({
    id: (record: FactRejectedRecord) => record.source_record_id,
    title: (record: FactRejectedRecord) => record.journal_title,
    pIssn: (record: FactRejectedRecord) => record.p_issn_raw,
    eIssn: (record: FactRejectedRecord) => record.e_issn_raw,
    date: (record: FactRejectedRecord) => record.event_day,
    rank: (record: FactRejectedRecord) => filters.matchingMode === 'extended' ? record.extended_sinta_rank : record.sinta_rank,
    match: (record: FactRejectedRecord) => filters.matchingMode === 'extended' ? record.extended_match_status : record.strict_match_status,
  }), [filters.matchingMode]);

  const { sortedItems: sortedRecords, sortKey, direction, requestSort } = useSortableData(
    filteredRecords, rejectedSortAccessors, 'date', 'desc',
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const pagedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage]);

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
      'Extended Match Status',
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
      `"${filters.matchingMode === 'extended' ? r.extended_sinta_rank : r.sinta_rank}"`,
      `"${r.strict_match_status}"`,
      `"${r.extended_match_status}"`,
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
            Route 2 • Record-Level Evidence & Visual Trends
          </span>
          <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
            Rejected Applications Observatory
          </h2>
          <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
            Individual application rejection records recorded between 2022 and 2026. Includes interactive monthly timelines,
            accreditation tier compositions, year-by-rank recurrence heatmaps, and paginated source facts (8,898 total source rows conserved).
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleExportCSV}>
          Export Filtered CSV ({filteredRecords.length.toLocaleString()})
        </button>
      </div>

      {/* Visual Analytics Row 1: Monthly Timeline & Rank Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        <BaseEChart
          title="Monthly Application Rejection Volume (2022–2026)"
          metricLabel="Monthly Volume"
          unit="rejection records"
          denominatorNote={`${filteredRecords.length.toLocaleString()} active records`}
          scopeNote={`Filtered: ${analyticsData.sortedMonths.length} active months`}
          options={monthlyTrendOptions}
          ariaLabel="Line chart showing monthly rejection application volume"
        />

        <BaseEChart
          title="Accreditation Tier (SINTA Rank) Composition"
          metricLabel="Rejections by SINTA Tier"
          unit="records"
          denominatorNote={`${filteredRecords.length.toLocaleString()} active records`}
          scopeNote={`Mode: ${filters.matchingMode.toUpperCase()}`}
          options={rankDistOptions}
          ariaLabel="Bar chart of rejections by national accreditation tier"
        />
      </div>

      {/* Visual Analytics Row 2: Year-by-Rank Heatmap */}
      <BaseEChart
        title="Year-by-Accreditation-Rank Event Intensity Heatmap"
        metricLabel="Event Intensity"
        unit="records"
        denominatorNote={`${filteredRecords.length.toLocaleString()} records across ${analyticsData.years.length} years`}
        scopeNote="Darker shades indicate higher rejection concentration"
        options={heatmapOptions}
        height={340}
        ariaLabel="Heatmap matrix plotting rejection record frequency across years and SINTA ranks"
      />

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
                <SortableHeader columnKey="id" label="Record ID" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="title" label="Journal Title" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="pIssn" label="P-ISSN" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="eIssn" label="E-ISSN" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="date" label="Date Rejected" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="rank" label="SINTA Rank" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="match" label="Match Status" activeKey={sortKey} direction={direction} onSort={requestSort} />
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
                pagedRecords.map((rec) => {
                  const effectiveRank = filters.matchingMode === 'extended' ? rec.extended_sinta_rank : rec.sinta_rank;
                  const effectiveMatch = filters.matchingMode === 'extended' ? rec.extended_match_status : rec.strict_match_status;
                  const effectiveJournalId = filters.matchingMode === 'extended' && rec.extended_match_status === 'matched'
                    ? rec.extended_journal_id || rec.journal_id
                    : rec.journal_id;

                  return (
                    <tr key={rec.source_record_id} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                      <td style={{ padding: 'var(--space-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
                        {rec.source_record_id}
                      </td>
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
                        <RankBadge rank={effectiveRank} />
                      </td>
                      <td style={{ padding: 'var(--space-3)' }}>
                        <span className={`badge ${effectiveMatch === 'matched' ? 'badge-sinta' : 'badge-neutral'}`}>
                          {effectiveMatch}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
