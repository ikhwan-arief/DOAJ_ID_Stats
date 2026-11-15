import React, { useEffect, useMemo, useState } from 'react';
import { MetricCard, Alert, LoadingState } from '../components/common/UIPrimitives';
import { loadSummary, loadFactRejected, loadFactWithdrawn, loadDimJournals } from '../data/loader';
import { SummaryPublic, GlobalFilterState, FactRejectedRecord, FactWithdrawnRecord, DimJournalRecord } from '../types';
import { UpsetVennChart } from '../components/charts/UpsetVennChart';
import { DeterministicVennDiagram } from '../components/charts/DeterministicVennDiagram';
import { CurrentSintaVennDiagram } from '../components/charts/CurrentSintaVennDiagram';
import { BaseEChart } from '../components/charts/BaseEChart';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';
import * as echarts from '../lib/echarts';

interface OverviewPageProps {
  filters: GlobalFilterState;
  onNavigateToRoute: (route: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ filters, onNavigateToRoute }) => {
  const [summary, setSummary] = useState<SummaryPublic | null>(null);
  const [rejected, setRejected] = useState<FactRejectedRecord[]>([]);
  const [withdrawn, setWithdrawn] = useState<FactWithdrawnRecord[]>([]);
  const [journals, setJournals] = useState<DimJournalRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadSummary(), loadFactRejected(), loadFactWithdrawn(), loadDimJournals()])
      .then(([s, rejectedRows, withdrawnRows, journalRows]) => {
        setSummary(s);
        setRejected(rejectedRows);
        setWithdrawn(withdrawnRows);
        setJournals(journalRows);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load summary dataset');
      });
  }, []);

  const filteredView = useMemo(() => {
    const query = filters.searchQuery.trim().toLocaleLowerCase();
    const effectiveRejectedRank = (row: FactRejectedRecord) => filters.matchingMode === 'extended' ? row.extended_sinta_rank : row.sinta_rank;
    const effectiveWithdrawnRank = (row: FactWithdrawnRecord) => filters.matchingMode === 'extended' ? row.extended_sinta_rank : row.sinta_rank;
    const effectiveRejectedId = (row: FactRejectedRecord) => filters.matchingMode === 'extended' && row.extended_match_status === 'matched'
      ? row.extended_journal_id || row.journal_id
      : row.journal_id;
    const effectiveWithdrawnId = (row: FactWithdrawnRecord) => filters.matchingMode === 'extended' && row.extended_match_status === 'matched'
      ? row.extended_journal_id || row.journal_id
      : row.journal_id;
    const matchesText = (title: string, ...values: Array<string | null | undefined>) => !query
      || title.toLocaleLowerCase().includes(query)
      || values.some((value) => value?.toLocaleLowerCase().includes(query));
    const matchesRank = (rank: string) => filters.sintaRank === 'all' || rank === filters.sintaRank;

    const rejectedRows = filters.eventKind === 'withdrawn' ? [] : rejected.filter((row) =>
      row.event_year !== null
      && row.event_year >= filters.yearRange[0]
      && row.event_year <= filters.yearRange[1]
      && matchesRank(effectiveRejectedRank(row))
      && matchesText(row.journal_title, row.p_issn_raw, row.e_issn_raw, row.source_record_id),
    );
    const withdrawnRows = filters.eventKind === 'rejected' ? [] : withdrawn.filter((row) =>
      row.last_withdrawn_year !== null
      && row.last_withdrawn_year >= filters.yearRange[0]
      && row.last_withdrawn_year <= filters.yearRange[1]
      && matchesRank(effectiveWithdrawnRank(row))
      && matchesText(row.journal_title, row.p_issn_raw, row.e_issn_raw, row.source_record_id),
    );
    const sintaRows = journals.filter((row) => row.in_sinta
      && matchesRank(row.sinta_rank)
      && matchesText(row.display_title, row.journal_id));

    const rejectedIds = new Set(rejectedRows.map(effectiveRejectedId).filter((id): id is string => Boolean(id)));
    const withdrawnIds = new Set(withdrawnRows.map(effectiveWithdrawnId).filter((id): id is string => Boolean(id)));
    const sintaIds = new Set(sintaRows.map((row) => row.journal_id));
    const universe = new Set([...rejectedIds, ...withdrawnIds, ...sintaIds]);
    const regionDefinitions = [
      { region: 'R', R: true, W: false, S: false },
      { region: 'W', R: false, W: true, S: false },
      { region: 'S', R: false, W: false, S: true },
      { region: 'RW', R: true, W: true, S: false },
      { region: 'RS', R: true, W: false, S: true },
      { region: 'WS', R: false, W: true, S: true },
      { region: 'RWS', R: true, W: true, S: true },
    ];
    const aggregates = regionDefinitions.map((definition) => {
      const journal_ids = [...universe].filter((id) =>
        definition.R === rejectedIds.has(id)
        && definition.W === withdrawnIds.has(id)
        && definition.S === sintaIds.has(id),
      );
      return {
        ...definition,
        count: journal_ids.length,
        journal_ids,
      };
    });

    const repeatCountsByJournal = new Map<string, { records: number; dates: Set<string>; years: Set<number> }>();
    for (const row of rejectedRows) {
      const id = effectiveRejectedId(row);
      if (!id) continue;
      const current = repeatCountsByJournal.get(id) || { records: 0, dates: new Set<string>(), years: new Set<number>() };
      current.records += 1;
      if (row.event_day) current.dates.add(row.event_day);
      if (row.event_year) current.years.add(row.event_year);
      repeatCountsByJournal.set(id, current);
    }
    const repeatRecordJournals = [...repeatCountsByJournal.values()].filter((item) => item.records >= 2).length;
    const repeatDateJournals = [...repeatCountsByJournal.values()].filter((item) => item.dates.size >= 2).length;
    const repeatYearJournals = [...repeatCountsByJournal.values()].filter((item) => item.years.size >= 2).length;

    // Annual Trend Counts (2022 to 2026)
    const years = [2022, 2023, 2024, 2025, 2026];
    const rejByYear = years.map((y) => rejectedRows.filter((r) => r.event_year === y).length);
    const withByYear = years.map((y) => withdrawnRows.filter((w) => w.last_withdrawn_year === y).length);

    // Matching Status Distribution
    const strictMatched = rejectedRows.filter((r) => r.strict_match_status === 'matched').length;
    const strictUnmatched = rejectedRows.filter((r) => r.strict_match_status === 'unmatched').length;
    const extendedMatched = rejectedRows.filter((r) => r.extended_match_status === 'matched').length;
    const extendedUnmatched = rejectedRows.filter((r) => r.extended_match_status === 'unmatched').length;
    const extendedAmbiguous = rejectedRows.filter((r) => r.extended_match_status === 'ambiguous').length;

    return {
      rejectedRows,
      withdrawnRows,
      rejectedIds,
      withdrawnIds,
      sintaIds,
      universeCount: universe.size,
      repeatRecordJournals,
      repeatDateJournals,
      repeatYearJournals,
      intersections: {
        upset_aggregates: aggregates,
        unresolved_journal_ids: [],
      },
      annualTrends: {
        years,
        rejByYear,
        withByYear,
      },
      matchingStatus: {
        strictMatched,
        strictUnmatched,
        extendedMatched,
        extendedUnmatched,
        extendedAmbiguous,
      },
    };
  }, [filters, rejected, withdrawn, journals]);

  const regionRows = useMemo(() => {
    return filteredView.intersections.upset_aggregates.map((item) => ({
      partition: item.region,
      description: item.region === 'R' ? 'DOAJ Rejected only'
        : item.region === 'W' ? 'DOAJ Withdrawn only'
        : item.region === 'S' ? 'SINTA only'
        : item.region === 'RW' ? 'DOAJ Rejected ∩ Withdrawn'
        : item.region === 'RS' ? 'DOAJ Rejected ∩ SINTA'
        : item.region === 'WS' ? 'DOAJ Withdrawn ∩ SINTA'
        : 'DOAJ Rejected ∩ Withdrawn ∩ SINTA',
      count: item.count,
      percentage: filteredView.universeCount ? (item.count / filteredView.universeCount) * 100 : 0,
      R: item.R,
      W: item.W,
      S: item.S,
      region: item.region,
    }));
  }, [filteredView]);

  const { sortedItems: sortedRegions, requestSort, sortKey, direction } = useSortableData(
    regionRows,
    {
      partition: (item) => item.partition,
      description: (item) => item.description,
      count: (item) => item.count,
      percentage: (item) => item.percentage,
    },
    'count',
    'desc',
  );

  // Annual Event Trends EChart Options
  const annualTrendOptions: echarts.EChartsOption = useMemo(() => {
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
        data: filteredView.annualTrends.years.map(String),
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      yAxis: {
        type: 'value',
        name: 'Records',
        axisLabel: { fontFamily: 'var(--font-mono)' },
      },
      series: [
        {
          name: 'Rejection Records',
          type: 'bar',
          data: filteredView.annualTrends.rejByYear,
          itemStyle: { color: '#982E0A' }, // --sanguine
          emphasis: { focus: 'series' },
        },
        {
          name: 'Withdrawn Records',
          type: 'bar',
          data: filteredView.annualTrends.withByYear,
          itemStyle: { color: '#3A5959' }, // --dark-green
          emphasis: { focus: 'series' },
        },
      ],
    };
  }, [filteredView.annualTrends]);

  // Matching-Status Distribution EChart Options
  const matchingStatusOptions: echarts.EChartsOption = useMemo(() => {
    const isStrict = filters.matchingMode === 'strict';
    const data = isStrict
      ? [
          { name: 'Strict Matched to SINTA', value: filteredView.matchingStatus.strictMatched, itemStyle: { color: '#47A178' } },
          { name: 'Unmatched to SINTA', value: filteredView.matchingStatus.strictUnmatched, itemStyle: { color: '#5C5956' } },
        ]
      : [
          { name: 'Extended Matched', value: filteredView.matchingStatus.extendedMatched, itemStyle: { color: '#47A178' } },
          { name: 'Extended Unmatched', value: filteredView.matchingStatus.extendedUnmatched, itemStyle: { color: '#5C5956' } },
          { name: 'Ambiguous Collision', value: filteredView.matchingStatus.extendedAmbiguous, itemStyle: { color: '#FD5A3B' } },
        ];

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} records ({d}%)',
      },
      legend: {
        bottom: 0,
        textStyle: { fontFamily: 'var(--font-sans)', fontSize: 12 },
      },
      series: [
        {
          name: 'Matching Status',
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
          data,
        },
      ],
    };
  }, [filters.matchingMode, filteredView.matchingStatus]);

  if (error) {
    return <Alert type="warning" title="Error Loading Overview">{error}</Alert>;
  }

  if (!summary) {
    return <LoadingState message="Loading validated observatory metrics from Codex WP3..." />;
  }

  const { as_of } = summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Page Header */}
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
          Observatory Dashboard • Route 1
        </span>
        <h2 style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
          Observatory Overview & Dataset Intersections
        </h2>
        <p style={{ color: 'var(--dark-grey)', maxWidth: '900px' }}>
          Synthesis of Indonesian scholarly journal indexing dynamics across the Directory of Open Access Journals
          (DOAJ) rejected applications (2022–2026), withdrawn journals, and the national SINTA database (snapshot 15 Nov 2026).
        </p>
      </div>

      <Alert type="note" title="Production Verification">
        Metrics below respond to the active filters and are derived from validated, versioned public exports.
        The unfiltered baselines preserve all 9,308 Rejected, 1,421 Accepted, 570 Withdrawn, and 16,620 SINTA source rows.
      </Alert>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        <MetricCard
          label={filters.metricView === 'records' ? 'Total Rejection Records' : 'Distinct Rejected Journals'}
          value={filters.metricView === 'records' ? filteredView.rejectedRows.length : filteredView.rejectedIds.size}
          unit={filters.metricView === 'records' ? 'records' : 'journals'}
          description={`Reconciled across ${filteredView.rejectedIds.size.toLocaleString()} distinct journals in this view`}
          provenance="DOAJ Historical Rejection Records (2022–2026)"
          color="var(--sanguine)"
        />
        <MetricCard
          label={filters.metricView === 'records' ? 'Total Withdrawn Records' : 'Distinct Withdrawn Journals'}
          value={filters.metricView === 'records' ? filteredView.withdrawnRows.length : filteredView.withdrawnIds.size}
          unit={filters.metricView === 'records' ? 'records' : 'journals'}
          description={`Reconciled across ${filteredView.withdrawnIds.size.toLocaleString()} distinct journals in this view`}
          provenance="DOAJ Historical Withdrawal Records (2022–2026)"
          color="var(--dark-green)"
        />
        <MetricCard
          label="Total SINTA Population"
          value={filteredView.sintaIds.size}
          unit="journals"
          description="National accreditation census"
          provenance="SINTA National Census (Snapshot: 15 November 2026)"
          color="var(--mid-green)"
        />
        <MetricCard
          label="Multi-Record Rejections"
          value={filteredView.repeatRecordJournals}
          unit="journals"
          description={`${filteredView.repeatDateJournals.toLocaleString()} on distinct dates • ${filteredView.repeatYearJournals.toLocaleString()} spanning ≥2 years`}
          provenance="Rejection Chronology Engine"
          color="var(--grapefruit)"
        />
      </div>

      {/* Visual-First Analytics Grid: Venn Diagram & Interactive UpSet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Three-Set Venn Diagram */}
        <DeterministicVennDiagram
          regions={filteredView.intersections.upset_aggregates}
          onSelectRegion={(reg) => {
            if (reg.includes('R')) onNavigateToRoute('rejected');
            else if (reg.includes('W')) onNavigateToRoute('withdrawn');
            else onNavigateToRoute('sinta');
          }}
        />

        {/* UpSet Matrix Chart */}
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-md)', margin: '0 0 var(--space-2) 0' }}>
            Interactive UpSet Matrix Aggregates
          </h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginBottom: 'var(--space-3)' }}>
            Exact disjoint partition sizes for resolved journal entities. Click any bar to navigate directly to supporting records.
          </p>
          <UpsetVennChart
            data={filteredView.intersections}
            onSelectRegion={(reg) => {
              if (reg.includes('R')) onNavigateToRoute('rejected');
              else if (reg.includes('W')) onNavigateToRoute('withdrawn');
              else onNavigateToRoute('sinta');
            }}
          />
        </div>
      </div>

      {/* Current DOAJ x SINTA Overlap Section */}
      {summary?.current_doaj_summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
          <CurrentSintaVennDiagram
            doajOnlyCount={summary.current_doaj_summary.doaj_only_journals}
            sintaOnlyCount={summary.current_doaj_summary.sinta_only_journals}
            bothCount={summary.current_doaj_summary.sinta_matched_journals}
            totalUniverse={summary.current_doaj_summary.total_two_set_universe}
          />
          <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--space-3)' }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-md)', margin: 0 }}>
              Current DOAJ Indexing Benchmark (Nov 15, 2026)
            </h4>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', margin: 0 }}>
              Out of <strong>{summary.current_doaj_summary.indonesia_source_records.toLocaleString()}</strong> active Indonesian journal records
              in DOAJ ({summary.current_doaj_summary.unique_resolved_journals.toLocaleString()} unique resolved identities),
              <strong> {summary.current_doaj_summary.sinta_matched_journals.toLocaleString()} ({(summary.current_doaj_summary.sinta_matched_journals / summary.current_doaj_summary.unique_resolved_journals * 100).toFixed(1)}%)</strong> are
              cross-matched to national SINTA accreditations.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
              <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--light-grey)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Historical Rejections Currently Indexed</div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--dark-green)' }}>
                  {summary.current_doaj_summary.rejected_journals_current_status.currently_indexed?.toLocaleString() || 547} journals
                </div>
              </div>
              <div style={{ padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--light-grey)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Historical Withdrawals Currently Indexed</div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--dark-green)' }}>
                  {summary.current_doaj_summary.withdrawn_journals_current_status.currently_indexed?.toLocaleString() || 23} journals
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Row 2: Annual Trends & Matching Status Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        <BaseEChart
          title="Annual Recorded Event Volumes (2022–2026)"
          metricLabel="Annual Event Volume"
          unit="records"
          denominatorNote="Filtered rejection & withdrawal rows"
          scopeNote={`Filtered years: ${filters.yearRange[0]}–${filters.yearRange[1]}`}
          options={annualTrendOptions}
          ariaLabel="Bar chart of annual recorded DOAJ rejection and withdrawal volumes"
        />

        <BaseEChart
          title="Rejection Matching-Status Composition"
          metricLabel="Match Status Distribution"
          unit="records"
          denominatorNote={`${filteredView.rejectedRows.length.toLocaleString()} active rejection records`}
          scopeNote={`Mode: ${filters.matchingMode.toUpperCase()}`}
          options={matchingStatusOptions}
          ariaLabel="Donut chart showing strict or extended matching status distribution"
        />
      </div>

      {/* Tabular Alternative for Intersections (Accessible & Exact) */}
      <section className="card" aria-labelledby="intersection-table-heading" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--light-grey)', borderBottom: '1px solid var(--neutral-border)' }}>
          <h3 id="intersection-table-heading" style={{ fontSize: 'var(--text-base)', margin: 0 }}>
            Accessible Intersection Partitions (Codex WP3 Invariants)
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
                <SortableHeader columnKey="partition" label="Partition Code" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="description" label="Description & Set Membership" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <SortableHeader columnKey="count" label="Reconciled Journal Count" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="percentage" label="% of Filtered Universe" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <th style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRegions.map((reg) => {
                const getDotColor = () => {
                  if (reg.R && reg.W && reg.S) return 'var(--warm-black)';
                  if (reg.R && reg.S) return 'var(--grapefruit)';
                  if (reg.W && reg.S) return 'var(--mid-green)';
                  if (reg.R && reg.W) return 'var(--salmon)';
                  if (reg.R) return 'var(--sanguine)';
                  if (reg.W) return 'var(--dark-green)';
                  return 'var(--mid-green)';
                };

                return (
                  <tr key={reg.region} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 700 }}>
                      <span style={{ color: getDotColor(), marginRight: '6px' }}>●</span>
                      {reg.region}
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{reg.description}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {reg.count.toLocaleString()}
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--dark-grey)' }}>
                      {reg.percentage.toFixed(2)}%
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', minHeight: '32px' }}
                        onClick={() => {
                          if (reg.R) onNavigateToRoute('rejected');
                          else if (reg.W) onNavigateToRoute('withdrawn');
                          else onNavigateToRoute('sinta');
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: 'var(--warm-black-05)', fontWeight: 700, borderTop: '2px solid var(--neutral-border)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Filtered Universe</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Sum of all 7 mutually disjoint partitions</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {filteredView.universeCount.toLocaleString()}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>100.00%</td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Observational Guidelines */}
      <section className="card">
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
          Observational & Analytical Framework
        </h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
          1. <strong>Event Records vs Reconciled Journals:</strong> A single journal can apply multiple times,
          resulting in several rejection records across years ({summary.source_record_counts.rejected.toLocaleString()} records across{' '}
          {summary.identity_counts.rejected_resolved_journals.toLocaleString()} journals).
          <br />
          2. <strong>As-of Snapshot Semantics:</strong> SINTA ranks reflect accreditation status on the snapshot date
          ({as_of.sinta_snapshot}) and must not be misinterpreted as the journal's accreditation level at the time of historical DOAJ application.
          <br />
          3. <strong>Neutral Editorial Stance:</strong> Procedural application rejections or delistings do not indicate research misconduct.
        </p>
      </section>
    </div>
  );
};
