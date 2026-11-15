import React, { useEffect, useMemo, useState } from 'react';
import { MetricCard, Alert, LoadingState } from '../components/common/UIPrimitives';
import { loadSummary, loadFactRejected, loadFactWithdrawn, loadDimJournals } from '../data/loader';
import { SummaryPublic, IntersectionsPublic, GlobalFilterState, FactRejectedRecord, FactWithdrawnRecord, DimJournalRecord } from '../types';
import { UpsetVennChart } from '../components/charts/UpsetVennChart';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';

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
        rejectedIds.has(id) === definition.R
        && withdrawnIds.has(id) === definition.W
        && sintaIds.has(id) === definition.S,
      );
      return { ...definition, count: journal_ids.length, journal_ids };
    });
    const histories = new Map<string, FactRejectedRecord[]>();
    rejectedRows.forEach((row) => {
      const id = effectiveRejectedId(row);
      if (!id) return;
      histories.set(id, [...(histories.get(id) || []), row]);
    });
    const repeatGroups = [...histories.values()].filter((rows) => rows.length >= 2);

    return {
      rejectedRows,
      withdrawnRows,
      rejectedIds,
      withdrawnIds,
      sintaIds,
      universeCount: universe.size,
      repeatRecordJournals: repeatGroups.length,
      repeatDateJournals: repeatGroups.filter((rows) => new Set(rows.map((row) => row.event_day).filter(Boolean)).size >= 2).length,
      repeatYearJournals: repeatGroups.filter((rows) => new Set(rows.map((row) => row.event_year).filter((year) => year !== null)).size >= 2).length,
      intersections: { upset_aggregates: aggregates, unresolved_journal_ids: [] } as IntersectionsPublic,
    };
  }, [filters, rejected, withdrawn, journals]);

  const regionRows = filteredView.intersections.upset_aggregates;
  const regionSortAccessors = useMemo(() => ({
    partition: (row: typeof regionRows[number]) => row.region,
    description: (row: typeof regionRows[number]) => row.region,
    count: (row: typeof regionRows[number]) => row.count,
    percentage: (row: typeof regionRows[number]) => filteredView.universeCount ? row.count / filteredView.universeCount : 0,
  }), [filteredView.universeCount]);
  const { sortedItems: sortedRegions, sortKey, direction, requestSort } = useSortableData(
    regionRows, regionSortAccessors, 'count', 'desc',
  );

  if (error) {
    return <Alert type="warning" title="Error Loading Overview">{error}</Alert>;
  }

  if (!summary) {
    return <LoadingState message="Loading validated observatory metrics from Codex WP3..." />;
  }

  const { identity_counts, as_of } = summary;

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
        The unfiltered baselines preserve all 8,898 Rejected, 570 Withdrawn, and 16,620 SINTA source rows.
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
          provenance={`DOAJ Rejected CSV (exported ${as_of.doaj_export_utc} UTC)`}
          color="var(--sanguine)"
        />
        <MetricCard
          label={filters.metricView === 'records' ? 'Total Withdrawn Records' : 'Distinct Withdrawn Journals'}
          value={filters.metricView === 'records' ? filteredView.withdrawnRows.length : filteredView.withdrawnIds.size}
          unit={filters.metricView === 'records' ? 'records' : 'journals'}
          description={`Reconciled across ${filteredView.withdrawnIds.size.toLocaleString()} distinct journals in this view`}
          provenance={`DOAJ Withdrawn CSV (exported ${as_of.doaj_export_utc} UTC)`}
          color="var(--dark-green)"
        />
        <MetricCard
          label="Total SINTA Population"
          value={filteredView.sintaIds.size}
          unit="journals"
          description="National accreditation census"
          provenance={`SINTA Final Census (as of ${as_of.sinta_snapshot})`}
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

      {/* UpSet Matrix Chart and Venn Region Partitions */}
      <section className="card" aria-labelledby="intersection-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h3 id="intersection-heading" style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
              Dataset Intersections (DOAJ Rejected ∩ DOAJ Withdrawn ∩ SINTA)
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)' }}>
              {filters.matchingMode === 'strict' ? 'Standard same-type ISSN matching' : 'Expanded print/online ISSN cross-check'} • Filtered journal universe:{' '}
              <strong>{filteredView.universeCount.toLocaleString()}</strong>
            </p>
          </div>
          <span className="badge badge-neutral">Exact Partitions (WP3 Invariants)</span>
        </div>

        {/* UpSet Chart */}
        <div style={{ marginTop: 'var(--space-4)' }}>
          <UpsetVennChart
            data={filteredView.intersections}
            onSelectRegion={(reg) => {
              if (reg.includes('R')) onNavigateToRoute('rejected');
              else if (reg.includes('W')) onNavigateToRoute('withdrawn');
              else onNavigateToRoute('sinta');
            }}
          />
        </div>

        {/* Tabular Alternative for Intersections (Accessible & Exact) */}
        <div style={{ marginTop: 'var(--space-5)', overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 'var(--text-sm)',
              textAlign: 'left',
            }}
          >
            <caption style={{ textAlign: 'left', fontWeight: 600, paddingBottom: 'var(--space-2)' }}>
              Accessible Intersection Partitions (Codex WP3 Regression-Tested Partitions)
            </caption>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--neutral-border)', backgroundColor: 'var(--light-grey)' }}>
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

                const getDesc = () => {
                  if (reg.region === 'R') return 'DOAJ Rejected only (not in SINTA census, no DOAJ withdrawal record)';
                  if (reg.region === 'W') return 'DOAJ Withdrawn only (not in SINTA census, no DOAJ rejection record)';
                  if (reg.region === 'S') return 'SINTA accredited journals without recorded DOAJ rejection or withdrawal';
                  if (reg.region === 'RW') return 'Journals with both DOAJ rejection and withdrawal records, outside SINTA';
                  if (reg.region === 'RS') return 'SINTA journals with recorded DOAJ rejection applications';
                  if (reg.region === 'WS') return 'SINTA journals with recorded DOAJ withdrawal records';
                  if (reg.region === 'RWS') return 'Journals present across all three sources (Rejected, Withdrawn, SINTA)';
                  return '';
                };

                return (
                  <tr key={reg.region} style={{ borderBottom: '1px solid var(--light-grey)' }}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 700 }}>
                      <span style={{ color: getDotColor(), marginRight: '6px' }}>●</span>
                      {reg.region}
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>{getDesc()}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {reg.count.toLocaleString()}
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--dark-grey)' }}>
                      {filteredView.universeCount ? ((reg.count / filteredView.universeCount) * 100).toFixed(2) : '0.00'}%
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
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>Total Universe</td>
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
          {identity_counts.rejected_resolved_journals.toLocaleString()} journals).
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
