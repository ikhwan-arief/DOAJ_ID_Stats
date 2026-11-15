import React, { useEffect, useState, useMemo } from 'react';
import { loadRejectionHistory, loadDimJournals, loadSummary } from '../data/loader';
import { RejectionHistoryRecord, DimJournalRecord, SummaryPublic, GlobalFilterState } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';
import { BaseEChart } from '../components/charts/BaseEChart';
import * as echarts from '../lib/echarts';

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

  // Visual Analytics Computations
  const historyAnalytics = useMemo(() => {
    // 1. Recurrence Histogram (1, 2, 3, 4, 5, 6+)
    const histBuckets: Record<string, number> = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6+': 0 };
    for (const h of filteredHistory) {
      const c = h.source_record_count;
      if (c === 1) histBuckets['1']++;
      else if (c === 2) histBuckets['2']++;
      else if (c === 3) histBuckets['3']++;
      else if (c === 4) histBuckets['4']++;
      else if (c === 5) histBuckets['5']++;
      else histBuckets['6+']++;
    }

    // 2. Re-Application Gap Interval Histogram
    const allGaps = filteredHistory.flatMap((h) => h.consecutive_day_gaps);
    const gapBuckets = {
      '≤30 days': allGaps.filter((g) => g <= 30).length,
      '31–90 days': allGaps.filter((g) => g >= 31 && g <= 90).length,
      '91–180 days': allGaps.filter((g) => g >= 91 && g <= 180).length,
      '181–365 days': allGaps.filter((g) => g >= 181 && g <= 365).length,
      '>365 days': allGaps.filter((g) => g > 365).length,
    };

    // 3. Top 20 Most Frequently Rejected Journal Identities
    const top20Journals = [...filteredHistory]
      .sort((a, b) => b.source_record_count - a.source_record_count)
      .slice(0, 20)
      .map((h) => {
        const title = dimJournals?.get(h.journal_id)?.display_title || h.journal_id;
        const truncatedTitle = title.length > 28 ? `${title.slice(0, 28)}…` : title;
        return {
          journal_id: h.journal_id,
          title,
          truncatedTitle,
          count: h.source_record_count,
          distinctDays: h.distinct_event_day_count,
        };
      });

    return {
      histBuckets,
      gapBuckets,
      totalGaps: allGaps.length,
      top20Journals,
    };
  }, [filteredHistory, dimJournals]);

  // Chart 1: Rejection Frequency Histogram Options
  const freqDistOptions: echarts.EChartsOption = useMemo(() => {
    const keys = ['1', '2', '3', '4', '5', '6+'];
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const pct = filteredHistory.length > 0 ? ((item.value / filteredHistory.length) * 100).toFixed(1) : '0';
          return `${item.name} application record(s): <strong>${item.value.toLocaleString()}</strong> journals (${pct}%)`;
        },
      },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        name: 'Record Count',
        data: keys.map((k) => `${k} record${k === '1' ? '' : 's'}`),
        axisLabel: { fontFamily: 'var(--font-sans)', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: 'Journals',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      series: [
        {
          name: 'Journals',
          type: 'bar',
          data: keys.map((k, idx) => ({
            value: historyAnalytics.histBuckets[k] || 0,
            itemStyle: {
              color: idx === 0 ? '#982E0A' : idx === 1 ? '#FD5A3B' : idx === 2 ? '#FA9A87' : '#282624',
            },
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
  }, [historyAnalytics.histBuckets, filteredHistory.length]);

  // Chart 2: Consecutive Day-Gap Interval Histogram
  const gapIntervalOptions: echarts.EChartsOption = useMemo(() => {
    const gapKeys = Object.keys(historyAnalytics.gapBuckets);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const pct = historyAnalytics.totalGaps > 0 ? ((item.value / historyAnalytics.totalGaps) * 100).toFixed(1) : '0';
          return `Interval ${item.name}: <strong>${item.value.toLocaleString()}</strong> consecutive pairs (${pct}%)`;
        },
      },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: gapKeys,
        axisLabel: { fontFamily: 'var(--font-sans)', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: 'Event Pairs',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      series: [
        {
          name: 'Consecutive Event Pairs',
          type: 'bar',
          data: gapKeys.map((k) => ({
            value: (historyAnalytics.gapBuckets as any)[k] || 0,
            itemStyle: { color: '#3A5959' },
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
  }, [historyAnalytics.gapBuckets, historyAnalytics.totalGaps]);

  // Chart 3: Top 20 Most Frequently Rejected Journals Horizontal Bar
  const top20Options: echarts.EChartsOption = useMemo(() => {
    const reversed = [...historyAnalytics.top20Journals].reverse();
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const fullObj = reversed[item.dataIndex];
          return `<strong>${fullObj.title}</strong><br/>Rejection Records: <strong>${item.value}</strong><br/>Distinct Event Days: ${fullObj.distinctDays}`;
        },
      },
      grid: { left: '3%', right: '8%', top: '5%', bottom: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        name: 'Records',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      yAxis: {
        type: 'category',
        data: reversed.map((j) => j.truncatedTitle),
        axisLabel: { fontFamily: 'var(--font-sans)', fontSize: 11 },
      },
      series: [
        {
          name: 'Total Rejections',
          type: 'bar',
          data: reversed.map((j) => j.count),
          itemStyle: { color: '#982E0A' },
          label: {
            show: true,
            position: 'right',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          },
        },
      ],
    };
  }, [historyAnalytics.top20Journals]);

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
          Route 3 • Temporal Chronology & Recurrence Analysis
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Rejection Frequency & Event Chronology
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Detailed chronology and recurrence analysis of application rejection records. Distinguishes single-event
          applications from repeated multi-year rejections, same-day recorded batches, consecutive time gaps, and identifies
          the Top 20 most frequently rejected journal identities.
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

      {/* Visual Analytics Row 1: Frequency Histogram & Day-Gap Histogram */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        <BaseEChart
          title="Journal Rejection Frequency Distribution"
          metricLabel="Rejection Recurrence"
          unit="unique journals"
          denominatorNote={`${filteredHistory.length.toLocaleString()} active journals`}
          scopeNote="Categorized by total recorded rejection events"
          options={freqDistOptions}
          ariaLabel="Bar chart of journal rejection frequency counts"
        />

        <BaseEChart
          title="Consecutive Application Rejection Intervals"
          metricLabel="Time Gap Between Sequential Rejections"
          unit="event pairs"
          denominatorNote={`${historyAnalytics.totalGaps.toLocaleString()} sequential event intervals`}
          scopeNote="Distribution of days elapsed between consecutive rejection records"
          options={gapIntervalOptions}
          ariaLabel="Histogram of consecutive days between sequential journal rejections"
        />
      </div>

      {/* Visual Analytics Row 2: Top 20 Frequently Rejected Journals */}
      <BaseEChart
        title="Top 20 Most Frequently Rejected Journal Identities"
        metricLabel="Total Historical Rejection Records"
        unit="records"
        denominatorNote="Sorted by total recorded application rejections (2022–2026)"
        scopeNote="Identifies persistent re-applications across the DOAJ review timeline"
        options={top20Options}
        height={480}
        ariaLabel="Horizontal bar chart showing top 20 most frequently rejected journal identities"
        onChartClick={(params) => {
          const clickedItem = historyAnalytics.top20Journals.find((j) => j.truncatedTitle === params.name);
          if (clickedItem) onSelectJournal(clickedItem.journal_id);
        }}
      />

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
