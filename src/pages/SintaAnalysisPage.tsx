import React, { useEffect, useState, useMemo } from 'react';
import { loadSummary, loadFactRejected, loadFactWithdrawn } from '../data/loader';
import { SummaryPublic, GlobalFilterState, FactRejectedRecord, FactWithdrawnRecord } from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';
import { BaseEChart } from '../components/charts/BaseEChart';
import * as echarts from '../lib/echarts';

interface SintaAnalysisPageProps {
  filters?: GlobalFilterState;
  onSelectRank: (rank: string) => void;
}

export const SintaAnalysisPage: React.FC<SintaAnalysisPageProps> = ({
  onSelectRank,
}) => {
  const [summary, setSummary] = useState<SummaryPublic | null>(null);
  const [rejected, setRejected] = useState<FactRejectedRecord[]>([]);
  const [withdrawn, setWithdrawn] = useState<FactWithdrawnRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadSummary(), loadFactRejected(), loadFactWithdrawn()])
      .then(([s, rej, withdr]) => {
        setSummary(s);
        setRejected(rej);
        setWithdrawn(withdr);
      })
      .catch((err) => setError(err.message || 'Failed to load summary dataset'));
  }, []);

  // Visual Analytics Computations
  const sintaAnalytics = useMemo(() => {
    if (!summary) return null;
    const ranks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA'];

    // 1. Grouped Bars: Rejection Records vs Withdrawn Records by SINTA Tier
    const rejCounts = ranks.map((rnk) => summary.rejected_rank_source_record_counts[rnk] || 0);
    const withCounts = ranks.map((rnk) => withdrawn.filter((w) => w.sinta_rank === rnk).length);

    // 2. 100% Stacked Prevalence: Rejected Journal Prevalence vs Unrejected SINTA Journals
    const sintaTotals = ranks.map((rnk) => summary.sinta_rank_unique_journal_counts[rnk] || 0);
    const distinctRejJournals = ranks.map((rnk) => summary.rejected_rank_unique_journal_counts[rnk] || 0);
    const unrejectedJournals = ranks.map((_, idx) => Math.max(0, sintaTotals[idx] - distinctRejJournals[idx]));

    // 3. Rank-by-Year Rejection Intensity Matrix (2022 to 2026)
    const years = [2022, 2023, 2024, 2025, 2026];
    const rankYearMatrix: Array<[number, number, number]> = [];
    let maxVal = 0;

    years.forEach((y, yIdx) => {
      ranks.forEach((rnk, rIdx) => {
        const count = rejected.filter((r) => r.event_year === y && r.sinta_rank === rnk).length;
        if (count > maxVal) maxVal = count;
        rankYearMatrix.push([yIdx, rIdx, count]);
      });
    });

    return {
      ranks,
      rejCounts,
      withCounts,
      sintaTotals,
      distinctRejJournals,
      unrejectedJournals,
      years,
      rankYearMatrix,
      maxVal,
    };
  }, [summary, rejected, withdrawn]);

  // Chart 1: Grouped Bars: Rejected Records vs Withdrawn Records
  const groupedBarOptions: echarts.EChartsOption = useMemo(() => {
    if (!sintaAnalytics) return {};
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['Rejection Records', 'Withdrawn Records'],
        bottom: 0,
        textStyle: { fontFamily: 'var(--font-sans)', fontSize: 12 },
      },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sintaAnalytics.ranks,
        axisLabel: { fontFamily: 'var(--font-mono)', fontWeight: 600 },
      },
      yAxis: {
        type: 'value',
        name: 'Event Records',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      series: [
        {
          name: 'Rejection Records',
          type: 'bar',
          data: sintaAnalytics.rejCounts,
          itemStyle: { color: '#982E0A' }, // --sanguine
          label: {
            show: true,
            position: 'top',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
          },
        },
        {
          name: 'Withdrawn Records',
          type: 'bar',
          data: sintaAnalytics.withCounts,
          itemStyle: { color: '#3A5959' }, // --dark-green
          label: {
            show: true,
            position: 'top',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
          },
        },
      ],
    };
  }, [sintaAnalytics]);

  // Chart 2: 100% Stacked Prevalence Bar Chart
  const stackedPrevalenceOptions: echarts.EChartsOption = useMemo(() => {
    if (!sintaAnalytics) return {};
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const rnk = params[0].name;
          const rej = params[0].value;
          const total = params[0].value + params[1].value;
          const pct = total > 0 ? ((rej / total) * 100).toFixed(1) : '0';
          return `<strong>SINTA ${rnk}</strong><br/>Rejected Journals: ${rej.toLocaleString()} (${pct}%)<br/>Total SINTA Census: ${total.toLocaleString()}`;
        },
      },
      legend: {
        data: ['Journals with Rejection Record', 'Journals without Rejection Record'],
        bottom: 0,
        textStyle: { fontFamily: 'var(--font-sans)', fontSize: 12 },
      },
      grid: { left: '4%', right: '4%', top: '10%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sintaAnalytics.ranks,
        axisLabel: { fontFamily: 'var(--font-mono)', fontWeight: 600 },
      },
      yAxis: {
        type: 'value',
        max: 100,
        name: '% of Tier Census',
        axisLabel: {
          formatter: '{value}%',
          fontFamily: 'var(--font-mono)',
        },
      },
      series: [
        {
          name: 'Journals with Rejection Record',
          type: 'bar',
          stack: 'total',
          data: sintaAnalytics.ranks.map((_, idx) => {
            const tot = sintaAnalytics.sintaTotals[idx];
            return tot > 0 ? Number(((sintaAnalytics.distinctRejJournals[idx] / tot) * 100).toFixed(2)) : 0;
          }),
          itemStyle: { color: '#FD5A3B' }, // --grapefruit
        },
        {
          name: 'Journals without Rejection Record',
          type: 'bar',
          stack: 'total',
          data: sintaAnalytics.ranks.map((_, idx) => {
            const tot = sintaAnalytics.sintaTotals[idx];
            return tot > 0 ? Number(((sintaAnalytics.unrejectedJournals[idx] / tot) * 100).toFixed(2)) : 100;
          }),
          itemStyle: { color: '#A3C386' }, // --light-green
        },
      ],
    };
  }, [sintaAnalytics]);

  // Chart 3: Rank-by-Year Event Intensity Heatmap
  const rankYearHeatmapOptions: echarts.EChartsOption = useMemo(() => {
    if (!sintaAnalytics) return {};
    return {
      tooltip: {
        position: 'top',
        formatter: (params: any) => {
          const [yIdx, rIdx, val] = params.data;
          const year = sintaAnalytics.years[yIdx];
          const rank = sintaAnalytics.ranks[rIdx];
          return `${year} • SINTA ${rank}: <strong>${val.toLocaleString()}</strong> rejections`;
        },
      },
      grid: { left: '8%', right: '5%', top: '8%', bottom: '18%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sintaAnalytics.years.map(String),
        splitArea: { show: true },
        axisLabel: { fontFamily: 'var(--font-mono)', fontWeight: 600 },
      },
      yAxis: {
        type: 'category',
        data: sintaAnalytics.ranks,
        splitArea: { show: true },
        axisLabel: { fontFamily: 'var(--font-mono)', fontWeight: 600 },
      },
      visualMap: {
        min: 0,
        max: sintaAnalytics.maxVal || 100,
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
          data: sintaAnalytics.rankYearMatrix,
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
  }, [sintaAnalytics]);

  const sintaTotal = summary ? summary.source_record_counts.sinta : 16620;
  const sintaRanks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched'];

  const sintaRows = useMemo(() => {
    if (!summary) return [];
    return sintaRanks.map((rank) => {
      const sintaCount = summary.sinta_rank_unique_journal_counts[rank] || 0;
      const rejectedRecordMatches = summary.rejected_rank_source_record_counts[rank] || 0;
      const rejectedJournalMatches = summary.rejected_rank_unique_journal_counts[rank] || 0;
      const percentage = sintaCount > 0 ? (sintaCount / sintaTotal) * 100 : 0;
      const rejectionRate = sintaCount > 0 ? (rejectedJournalMatches / sintaCount) * 100 : 0;

      return {
        rank,
        sintaCount,
        percentage,
        rejectedRecordMatches,
        rejectedJournalMatches,
        rejectionRate,
      };
    });
  }, [summary, sintaTotal]);

  const sintaSortAccessors = useMemo(() => ({
    tier: (item: (typeof sintaRows)[number]) => item.rank,
    journals: (item: (typeof sintaRows)[number]) => item.sintaCount,
    percentage: (item: (typeof sintaRows)[number]) => item.percentage,
    records: (item: (typeof sintaRows)[number]) => item.rejectedRecordMatches,
    distinct: (item: (typeof sintaRows)[number]) => item.rejectedJournalMatches,
    rate: (item: (typeof sintaRows)[number]) => item.rejectionRate,
  }), []);

  const { sortedItems: sortedSintaRows, sortKey, direction, requestSort } = useSortableData(
    sintaRows, sintaSortAccessors, 'journals', 'desc',
  );

  if (error) {
    return <Alert type="warning" title="Error Loading SINTA Analysis">{error}</Alert>;
  }

  if (!summary || !sintaAnalytics) {
    return <LoadingState message="Loading national SINTA population census..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            color: 'var(--mid-green)',
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          Route 5 • National Accreditation Context & Comparative Visualizations
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          SINTA Population Breakdown & Indexing Dynamics
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Comprehensive analysis across all national accreditation tiers (SINTA 1 through 6), unaccredited journals (NA),
          and unmatched non-SINTA journals. Features comparative grouped bars, 100% stacked prevalence charts, and accreditation year-intensity heatmaps.
        </p>
      </div>

      <Alert type="note" title="Denominator Clarification">
        Percentages are calculated using the verified November 2026 SINTA census ({sintaTotal.toLocaleString()} total journals)
        as the official denominator. Journal prevalence measures distinct rejected journals divided by tier population.
      </Alert>

      {/* Visual Analytics Row 1: Grouped Bars & 100% Stacked Prevalence */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        <BaseEChart
          title="Grouped Events: Rejections vs Withdrawals by SINTA Tier"
          metricLabel="Event Record Volume"
          unit="records"
          denominatorNote="National SINTA tiers S1–S6 and NA"
          scopeNote="Compares procedural application rejections to delisting events"
          options={groupedBarOptions}
          ariaLabel="Grouped bar chart comparing DOAJ rejections and withdrawals across SINTA tiers"
        />

        <BaseEChart
          title="100% Stacked Rejection Prevalence across Tiers"
          metricLabel="Prevalence Proportion"
          unit="% of tier census"
          denominatorNote="Tier journal census population"
          scopeNote="Proportion of journals with ≥1 recorded DOAJ rejection"
          options={stackedPrevalenceOptions}
          ariaLabel="100% stacked bar chart showing rejection prevalence across accreditation tiers"
        />
      </div>

      {/* Visual Analytics Row 2: Rank-by-Year Intensity Heatmap */}
      <BaseEChart
        title="Accreditation Tier (S1–S6, NA) by Year Event Intensity"
        metricLabel="Application Rejection Intensity"
        unit="records"
        denominatorNote="Total rejection records matched to SINTA tiers by calendar year"
        scopeNote="Darker tones indicate higher yearly rejection frequency in tier"
        options={rankYearHeatmapOptions}
        height={320}
        ariaLabel="Heatmap matrix plotting rejection intensity across calendar years and SINTA ranks"
      />

      {/* Grid of Accreditation Tiers */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Accreditation Tiers: Population Baseline & DOAJ Record Prevalences
          </h3>
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
                <SortableHeader columnKey="tier" label="SINTA Tier" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="journals" label="Total Journals in SINTA" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="percentage" label="% of SINTA Census" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="records" label="Matched Rejection Records" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="distinct" label="Distinct Rejected Journals" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="rate" label="Journal Prevalence" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedSintaRows.map((row) => (
                <tr key={row.rank} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                  <td style={{ padding: 'var(--space-3)' }}>
                    <RankBadge rank={row.rank} />
                    <span style={{ marginLeft: 'var(--space-2)', fontWeight: 600 }}>
                      {row.rank === 'NA'
                        ? 'Not Accredited (NA)'
                        : row.rank === 'unmatched'
                        ? 'Outside SINTA Database'
                        : `SINTA ${row.rank.slice(1)}`}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {row.sintaCount ? row.sintaCount.toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--dark-grey)' }}>
                    {row.sintaCount ? `${row.percentage.toFixed(2)}%` : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--sanguine)' }}>
                    {row.rejectedRecordMatches.toLocaleString()}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {row.rejectedJournalMatches.toLocaleString()}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {row.sintaCount ? `${row.rejectionRate.toFixed(1)}%` : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '2px 8px', minHeight: '30px', fontSize: 'var(--text-xs)' }}
                      onClick={() => onSelectRank(row.rank)}
                    >
                      Filter {row.rank}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--warm-black-05)', fontWeight: 700, borderTop: '2px solid var(--neutral-border)' }}>
                <td style={{ padding: 'var(--space-3)' }}>Total SINTA Census</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {sintaTotal.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>100.00%</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {Object.entries(summary.rejected_rank_source_record_counts)
                    .filter(([rank]) => rank !== 'unmatched' && rank !== 'ambiguous')
                    .reduce((sum, [, count]) => sum + count, 0)
                    .toLocaleString()} matched
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {Object.values(summary.rejected_rank_unique_journal_counts).reduce((sum, count) => sum + count, 0).toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>—</td>
                <td style={{ padding: 'var(--space-3)' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
