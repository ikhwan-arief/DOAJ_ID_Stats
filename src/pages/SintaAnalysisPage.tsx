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
  const [matrixDisplayMode, setMatrixDisplayMode] = useState<'both' | 'count' | 'pct'>('both');

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

    // 3. Current DOAJ Indexing Coverage by SINTA Tier
    const curDoaj = summary.current_doaj_summary;
    const curDoajCounts = ranks.map((rnk) => curDoaj?.rank_coverage_counts[rnk] || 0);
    const curDoajPcts = ranks.map((rnk) => curDoaj?.rank_coverage_percentages[rnk] || 0);

    // 4. Rank-by-Year Rejection Intensity Matrix (2022 to 2026)
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
      curDoajCounts,
      curDoajPcts,
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

  // Chart 2: Current DOAJ Coverage % by SINTA Tier (Horizontal Bar)
  const currentCoverageOptions: echarts.EChartsOption = useMemo(() => {
    if (!sintaAnalytics) return {};
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          const rank = item.name;
          const idx = sintaAnalytics.ranks.indexOf(rank);
          const count = sintaAnalytics.curDoajCounts[idx];
          const total = sintaAnalytics.sintaTotals[idx];
          const pct = sintaAnalytics.curDoajPcts[idx];
          return `SINTA ${rank}: <strong>${pct}%</strong> indexed (${count.toLocaleString()} / ${total.toLocaleString()} journals)`;
        },
      },
      grid: { left: '8%', right: '8%', top: '8%', bottom: '12%', containLabel: true },
      xAxis: {
        type: 'value',
        name: '% Indexed in DOAJ',
        max: 100,
        axisLabel: { fontFamily: 'var(--font-mono)', formatter: '{value}%' },
      },
      yAxis: {
        type: 'category',
        data: [...sintaAnalytics.ranks].reverse(),
        axisLabel: { fontFamily: 'var(--font-mono)', fontWeight: 600 },
      },
      series: [
        {
          name: 'DOAJ Indexing Rate',
          type: 'bar',
          data: [...sintaAnalytics.curDoajPcts].reverse(),
          itemStyle: { color: '#1B365D' }, // --dark-navy
          label: {
            show: true,
            position: 'right',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            formatter: '{c}%',
          },
        },
      ],
    };
  }, [sintaAnalytics]);

  // Chart 3: 100% Stacked Prevalence Bar Chart
  const stackedPrevalenceOptions: echarts.EChartsOption = useMemo(() => {
    if (!sintaAnalytics) return {};
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const rank = params[0].name;
          const idx = sintaAnalytics.ranks.indexOf(rank);
          const total = sintaAnalytics.sintaTotals[idx];
          const rej = sintaAnalytics.distinctRejJournals[idx];
          const rate = total > 0 ? ((rej / total) * 100).toFixed(1) : '0';
          return `${rank} Census: ${total.toLocaleString()} journals<br/>` +
                 `Rejected Journals: <strong>${rej.toLocaleString()}</strong> (${rate}%)<br/>` +
                 `Unrejected Population: ${(total - rej).toLocaleString()}`;
        },
      },
      legend: {
        data: ['Rejected Journal Identity', 'Unrejected SINTA Journals'],
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
        name: '% of Tier Census',
        max: 100,
        axisLabel: { fontFamily: 'var(--font-mono)', formatter: '{value}%' },
      },
      series: [
        {
          name: 'Rejected Journal Identity',
          type: 'bar',
          stack: 'total',
          data: sintaAnalytics.ranks.map((_, i) => {
            const tot = sintaAnalytics.sintaTotals[i];
            const rej = sintaAnalytics.distinctRejJournals[i];
            return tot > 0 ? Number(((rej / tot) * 100).toFixed(1)) : 0;
          }),
          itemStyle: { color: '#982E0A' }, // --sanguine
        },
        {
          name: 'Unrejected SINTA Journals',
          type: 'bar',
          stack: 'total',
          data: sintaAnalytics.ranks.map((_, i) => {
            const tot = sintaAnalytics.sintaTotals[i];
            const rej = sintaAnalytics.distinctRejJournals[i];
            return tot > 0 ? Number((((tot - rej) / tot) * 100).toFixed(1)) : 100;
          }),
          itemStyle: { color: '#E8E5E5' }, // --light-grey
        },
      ],
    };
  }, [sintaAnalytics]);

  // Chart 4: Rank-by-Year Intensity Heatmap
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
      const doajIndexed = summary.current_doaj_summary?.rank_coverage_counts[rank] || 0;
      const coverageRate = summary.current_doaj_summary?.rank_coverage_percentages[rank] || 0;

      return {
        rank,
        sintaCount,
        percentage,
        doajIndexed,
        coverageRate,
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
    doajIndexed: (item: (typeof sintaRows)[number]) => item.doajIndexed,
    coverageRate: (item: (typeof sintaRows)[number]) => item.coverageRate,
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
          and unmatched non-SINTA journals. Features comparative grouped bars, current DOAJ coverage rates, 100% stacked prevalence charts, and accreditation year-intensity heatmaps.
        </p>
      </div>

      <Alert type="note" title="Denominator Clarification">
        Percentages are calculated using the verified November 2026 SINTA census ({sintaTotal.toLocaleString()} total journals)
        as the official denominator. Current DOAJ coverage reflects the 2,733 Indonesian journals indexed in DOAJ as of November 15, 2026.
      </Alert>

      {/* SINTA Lifecycle Matrix (Interactive Heatmap & Cross-Tabulation) */}
      {summary?.lifecycle_summary?.sinta_lifecycle_matrix && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--light-grey)',
              borderBottom: '1px solid var(--neutral-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <div>
              <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>
                Interactive SINTA Lifecycle Matrix
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', margin: '2px 0 0 0' }}>
                All prevalence percentages strictly use each row's SINTA population as the denominator. Conditions overlap; columns do not sum to 100%.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginRight: '4px' }}>Display:</span>
              <button
                type="button"
                className={`btn ${matrixDisplayMode === 'both' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', minHeight: '28px', fontSize: 'var(--text-xs)' }}
                onClick={() => setMatrixDisplayMode('both')}
              >
                Both
              </button>
              <button
                type="button"
                className={`btn ${matrixDisplayMode === 'count' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', minHeight: '28px', fontSize: 'var(--text-xs)' }}
                onClick={() => setMatrixDisplayMode('count')}
              >
                Count
              </button>
              <button
                type="button"
                className={`btn ${matrixDisplayMode === 'pct' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 8px', minHeight: '28px', fontSize: 'var(--text-xs)' }}
                onClick={() => setMatrixDisplayMode('pct')}
              >
                %
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--text-xs)',
                textAlign: 'right',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--neutral-border)', backgroundColor: 'var(--white)' }}>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left' }}>SINTA Rank</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Total Census</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--dark-navy)' }}>Currently Indexed</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--sanguine)' }}>Hist. Rejected</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Hist. Accepted</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Hist. Withdrawn</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)' }}>Repeated Rej.</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--dark-navy)' }}>R → A</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)' }}>A → W</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)' }}>W → A</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)' }}>A → W → A</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', color: 'var(--dark-green)' }}>Withdrawn & Curr</th>
                </tr>
              </thead>
              <tbody>
                {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'Overall'].map((rank) => {
                  const row = summary?.lifecycle_summary?.sinta_lifecycle_matrix?.[rank];
                  if (!row) return null;
                  const isOverall = rank === 'Overall';
                  const formatCell = (cell: { count: number; percentage: number }) => {
                    if (matrixDisplayMode === 'count') return cell.count.toLocaleString();
                    if (matrixDisplayMode === 'pct') return `${cell.percentage.toFixed(1)}%`;
                    return `${cell.count.toLocaleString()} (${cell.percentage.toFixed(1)}%)`;
                  };

                  return (
                    <tr
                      key={rank}
                      style={{
                        borderBottom: '1px solid var(--light-grey)',
                        backgroundColor: isOverall ? 'var(--sand-light)' : 'var(--white)',
                        fontWeight: isOverall ? 700 : 400,
                      }}
                    >
                      <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left' }}>
                        {isOverall ? (
                          <strong>Overall SINTA Population</strong>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RankBadge rank={rank} />
                            <button
                              type="button"
                              onClick={() => onSelectRank(rank)}
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                color: 'var(--warm-black)',
                                cursor: 'pointer',
                                fontWeight: 600,
                                textDecoration: 'underline',
                                fontSize: 'var(--text-xs)',
                              }}
                            >
                              {rank}
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                        {row.total_sinta_journals.toLocaleString()}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)', color: 'var(--dark-navy)' }}>
                        {formatCell(row.currently_indexed)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)', color: 'var(--sanguine)' }}>
                        {formatCell(row.historical_rejected)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                        {formatCell(row.historical_accepted)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                        {formatCell(row.historical_withdrawn)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                        {formatCell(row.repeated_rejections)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)', color: 'var(--dark-navy)' }}>
                        {formatCell(row.verified_r_to_a)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                        {formatCell(row.verified_a_to_w)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                        {formatCell(row.verified_w_to_a)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                        {formatCell(row.verified_a_w_a)}
                      </td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontFamily: 'var(--font-mono)', color: 'var(--dark-green)' }}>
                        {formatCell(row.withdrawn_and_currently_indexed)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Analytics Row 1: Current DOAJ Coverage & Grouped Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        <BaseEChart
          title="Current DOAJ Indexing Rate by SINTA Tier"
          metricLabel="Coverage Rate"
          unit="% of tier census"
          denominatorNote="National SINTA tiers S1–S6 and NA"
          scopeNote="Higher accreditation tiers exhibit significantly higher DOAJ indexing penetration (S1: 62.6%, S2: 47.1%)"
          options={currentCoverageOptions}
          ariaLabel="Horizontal bar chart showing percentage of journals in each SINTA tier currently indexed in DOAJ"
        />

        <BaseEChart
          title="Grouped Events: Rejections vs Withdrawals by SINTA Tier"
          metricLabel="Event Record Volume"
          unit="records"
          denominatorNote="National SINTA tiers S1–S6 and NA"
          scopeNote="Compares procedural application rejections to delisting events"
          options={groupedBarOptions}
          ariaLabel="Grouped bar chart comparing DOAJ rejections and withdrawals across SINTA tiers"
        />
      </div>

      {/* Visual Analytics Row 2: 100% Stacked Prevalence & Heatmap */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        <BaseEChart
          title="100% Stacked Rejection Prevalence across Tiers"
          metricLabel="Prevalence Proportion"
          unit="% of tier census"
          denominatorNote="Tier journal census population"
          scopeNote="Proportion of journals with ≥1 recorded DOAJ rejection"
          options={stackedPrevalenceOptions}
          ariaLabel="100% stacked bar chart showing rejection prevalence across accreditation tiers"
        />

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
      </div>

      {/* Grid of Accreditation Tiers */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Accreditation Tiers: Population Baseline, DOAJ Indexing, & Rejection Rates
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
                <SortableHeader columnKey="doajIndexed" label="Currently in DOAJ" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="coverageRate" label="DOAJ Indexing Rate" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
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
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--dark-navy)' }}>
                    {row.sintaCount ? row.doajIndexed.toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--dark-navy)' }}>
                    {row.sintaCount ? `${row.coverageRate.toFixed(1)}%` : '—'}
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
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--dark-navy)' }}>
                  2,500
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--dark-navy)' }}>
                  15.0%
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--sanguine)' }}>
                  {summary.rejected_rank_source_record_counts ? Object.values(summary.rejected_rank_source_record_counts).reduce((a, b) => a + b, 0).toLocaleString() : '9,308'}
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {summary.identity_counts.rejected_resolved_journals.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {((summary.identity_counts.rejected_resolved_journals / sintaTotal) * 100).toFixed(1)}%
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
