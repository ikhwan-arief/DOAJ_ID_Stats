/**
 * Publisher Profile Page Component (Subroute: #/publisher/{publisher-id}).
 * Displays canonical publisher identity, confirmed aliases, KPIs, linked journal portfolio,
 * chronological event trends, and direct navigation to Journal Explorer profiles.
 *
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  loadDimPublishers,
  loadPublisherJournalLinks,
  loadDimJournals,
  loadFactRejected,
  loadFactAccepted,
  loadFactWithdrawn,
  loadFactDoajCurrent,
  loadSintaSnapshot,
} from '../data/loader';
import {
  PublisherRecord,
  PublisherJournalLink,
  DimJournalRecord,
  FactRejectedRecord,
  FactAcceptedRecord,
  FactWithdrawnRecord,
  FactDoajCurrentRecord,
  SintaSnapshotRecord,
  SintaRank,
  CurrentDoajStatus,
} from '../types';
import { RankBadge, Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';
import { BaseEChart } from '../components/charts/BaseEChart';
import { formatCurrentDoajStatusBadge } from '../lib/matchingLabels';
import {
  formatSintaRankLabel,
  getSintaRankTooltipDescription,
  getSintaRankColor,
  createCategoricalAxisLabelConfig,
  createCategoricalGridConfig,
} from '../lib/chartAxisConfig';
import * as echarts from '../lib/echarts';

interface PublisherProfilePageProps {
  publisherId: string;
  onNavigateToJournal: (journalId: string) => void;
  onBackToDirectory: () => void;
  onBackToPrevious?: () => void;
  previousRouteLabel?: string;
}

interface PortfolioJournalRow {
  journal_id: string;
  display_title: string;
  p_issn: string;
  e_issn: string;
  sinta_rank: SintaRank;
  sinta_affiliation: string;
  rejected_count: number;
  accepted_count: number;
  withdrawn_count: number;
  current_doaj_status: CurrentDoajStatus;
  relationship_scope: 'Current DOAJ Publisher' | 'Historical DOAJ Publisher' | 'Current & Historical Publisher';
  latest_event: string;
  journal_url: string | null;
  doaj_profile_url: string | null;
}

export const PublisherProfilePage: React.FC<PublisherProfilePageProps> = ({
  publisherId,
  onNavigateToJournal,
  onBackToDirectory,
  onBackToPrevious,
  previousRouteLabel,
}) => {
  const [publishers, setPublishers] = useState<PublisherRecord[] | null>(null);
  const [links, setLinks] = useState<PublisherJournalLink[] | null>(null);
  const [dimJournals, setDimJournals] = useState<DimJournalRecord[] | null>(null);
  const [rejectedRecords, setRejectedRecords] = useState<FactRejectedRecord[] | null>(null);
  const [acceptedRecords, setAcceptedRecords] = useState<FactAcceptedRecord[] | null>(null);
  const [withdrawnRecords, setWithdrawnRecords] = useState<FactWithdrawnRecord[] | null>(null);
  const [currentRecords, setCurrentRecords] = useState<FactDoajCurrentRecord[] | null>(null);
  const [sintaRecords, setSintaRecords] = useState<SintaSnapshotRecord[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Table filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sintaFilter, setSintaFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  useEffect(() => {
    Promise.all([
      loadDimPublishers(),
      loadPublisherJournalLinks(),
      loadDimJournals(),
      loadFactRejected(),
      loadFactAccepted(),
      loadFactWithdrawn(),
      loadFactDoajCurrent(),
      loadSintaSnapshot(),
    ])
      .then(([pubs, lks, dimJ, rej, acc, withdr, curr, sintaList]) => {
        setPublishers(pubs);
        setLinks(lks);
        setDimJournals(dimJ);
        setRejectedRecords(rej);
        setAcceptedRecords(acc);
        setWithdrawnRecords(withdr);
        setCurrentRecords(curr);
        setSintaRecords(sintaList);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load publisher profile data');
        setLoading(false);
      });
  }, []);

  const publisher = useMemo(() => {
    if (!publishers) return null;
    return publishers.find((p) => p.publisher_id === publisherId) || null;
  }, [publishers, publisherId]);

  // Build portfolio table data for this publisher
  const portfolioJournals = useMemo<PortfolioJournalRow[]>(() => {
    if (!publisher || !links || !dimJournals) return [];

    const pubLinks = links.filter((l) => l.publisher_id === publisher.publisher_id);
    const jidSet = new Set(pubLinks.map((l) => l.journal_id));

    // Determine current vs historical relationships
    const isCurrentJid = new Set(pubLinks.filter((l) => l.is_current).map((l) => l.journal_id));
    const isHistJid = new Set(pubLinks.filter((l) => !l.is_current).map((l) => l.journal_id));

    // Map journals
    const dimMap = new Map(dimJournals.map((j) => [j.journal_id, j]));

    // Pre-group fact records by journal_id
    const rejByJid = new Map<string, FactRejectedRecord[]>();
    rejectedRecords?.forEach((r) => {
      if (r.journal_id) {
        const arr = rejByJid.get(r.journal_id) || [];
        arr.push(r);
        rejByJid.set(r.journal_id, arr);
      }
    });

    const accByJid = new Map<string, FactAcceptedRecord[]>();
    acceptedRecords?.forEach((r) => {
      if (r.journal_id) {
        const arr = accByJid.get(r.journal_id) || [];
        arr.push(r);
        accByJid.set(r.journal_id, arr);
      }
    });

    const withdrByJid = new Map<string, FactWithdrawnRecord[]>();
    withdrawnRecords?.forEach((r) => {
      if (r.journal_id) {
        const arr = withdrByJid.get(r.journal_id) || [];
        arr.push(r);
        withdrByJid.set(r.journal_id, arr);
      }
    });

    const currByJid = new Map<string, FactDoajCurrentRecord>();
    currentRecords?.forEach((r) => {
      if (r.journal_id) {
        currByJid.set(r.journal_id, r);
      }
    });

    const sintaByJid = new Map<string, SintaSnapshotRecord>();
    sintaRecords?.forEach((r) => {
      sintaByJid.set(r.journal_id, r);
    });

    const rows: PortfolioJournalRow[] = [];
    jidSet.forEach((jid) => {
      const dim = dimMap.get(jid);
      if (!dim) return;

      const curr = currByJid.get(jid);
      const sinta = sintaByJid.get(jid);
      const rejList = rejByJid.get(jid) || [];
      const accList = accByJid.get(jid) || [];
      const withdrList = withdrByJid.get(jid) || [];

      // Determine ISSNs
      const pIssn = curr?.p_issn_raw || rejList[0]?.p_issn_raw || withdrList[0]?.p_issn_raw || sinta?.p_issn_raw || '—';
      const eIssn = curr?.e_issn_raw || rejList[0]?.e_issn_raw || withdrList[0]?.e_issn_raw || sinta?.e_issn_raw || '—';

      // Relationship scope
      let relScope: PortfolioJournalRow['relationship_scope'] = 'Historical DOAJ Publisher';
      if (isCurrentJid.has(jid) && isHistJid.has(jid)) {
        relScope = 'Current & Historical Publisher';
      } else if (isCurrentJid.has(jid)) {
        relScope = 'Current DOAJ Publisher';
      }

      // Latest recorded event
      let latestEvent = dim.last_historical_event || '—';
      if (latestEvent === 'R') latestEvent = 'Rejected';
      else if (latestEvent === 'A') latestEvent = 'Accepted';
      else if (latestEvent === 'W') latestEvent = 'Withdrawn';

      const journalUrl = curr?.journal_url || rejList[0]?.journal_url || withdrList[0]?.journal_url || sinta?.website_url || null;
      const doajUrl = curr?.doaj_profile_url || withdrList[0]?.doaj_profile_url || dim.current_doaj_profile_url || null;

      rows.push({
        journal_id: jid,
        display_title: dim.display_title || sinta?.journal_title || rejList[0]?.journal_title || 'Untitled Journal',
        p_issn: pIssn,
        e_issn: eIssn,
        sinta_rank: dim.sinta_rank || 'unmatched',
        sinta_affiliation: sinta?.affiliation || '—',
        rejected_count: rejList.length,
        accepted_count: accList.length,
        withdrawn_count: withdrList.length,
        current_doaj_status: dim.current_doaj_status || 'not_found',
        relationship_scope: relScope,
        latest_event: latestEvent,
        journal_url: journalUrl,
        doaj_profile_url: doajUrl,
      });
    });

    return rows;
  }, [publisher, links, dimJournals, rejectedRecords, acceptedRecords, withdrawnRecords, currentRecords, sintaRecords]);

  // Filtered portfolio rows
  const filteredPortfolio = useMemo(() => {
    return portfolioJournals.filter((row) => {
      if (sintaFilter !== 'all' && row.sinta_rank !== sintaFilter) return false;
      if (statusFilter !== 'all' && row.current_doaj_status !== statusFilter) return false;
      if (eventFilter === 'rejected' && row.rejected_count === 0) return false;
      if (eventFilter === 'accepted' && row.accepted_count === 0) return false;
      if (eventFilter === 'withdrawn' && row.withdrawn_count === 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = row.display_title.toLowerCase().includes(q);
        const pIssnMatch = row.p_issn.toLowerCase().includes(q);
        const eIssnMatch = row.e_issn.toLowerCase().includes(q);
        const affilMatch = row.sinta_affiliation.toLowerCase().includes(q);
        if (!titleMatch && !pIssnMatch && !eIssnMatch && !affilMatch) return false;
      }
      return true;
    });
  }, [portfolioJournals, sintaFilter, statusFilter, eventFilter, searchQuery]);

  const portfolioSortAccessors = useMemo(() => ({
    title: (row: PortfolioJournalRow) => row.display_title,
    sinta: (row: PortfolioJournalRow) => row.sinta_rank,
    rejected: (row: PortfolioJournalRow) => row.rejected_count,
    accepted: (row: PortfolioJournalRow) => row.accepted_count,
    withdrawn: (row: PortfolioJournalRow) => row.withdrawn_count,
    status: (row: PortfolioJournalRow) => row.current_doaj_status,
  }), []);

  const {
    sortedItems: sortedPortfolio,
    sortKey,
    direction,
    requestSort,
  } = useSortableData(filteredPortfolio, portfolioSortAccessors, 'title', 'asc');

  const totalPages = Math.ceil(sortedPortfolio.length / pageSize) || 1;
  const paginatedPortfolio = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPortfolio.slice(start, start + pageSize);
  }, [sortedPortfolio, currentPage, pageSize]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const handleExportPortfolioCSV = () => {
    if (!publisher || sortedPortfolio.length === 0) return;
    const headers = [
      'Journal ID',
      'Display Title',
      'P-ISSN',
      'E-ISSN',
      'SINTA Rank',
      'SINTA Affiliation',
      'Historical Rejected Count',
      'Historical Accepted Count',
      'Historical Withdrawn Count',
      'Current DOAJ Status',
      'Relationship Scope',
      'Latest Historical Event',
    ];
    const csvRows = [headers.join(',')];
    sortedPortfolio.forEach((row: PortfolioJournalRow) => {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      csvRows.push([
        escape(row.journal_id),
        escape(row.display_title),
        escape(row.p_issn),
        escape(row.e_issn),
        escape(row.sinta_rank),
        escape(row.sinta_affiliation),
        row.rejected_count,
        row.accepted_count,
        row.withdrawn_count,
        escape(row.current_doaj_status),
        escape(row.relationship_scope),
        escape(row.latest_event),
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `publisher_${publisher.publisher_id}_portfolio.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trend Chart Option (Historical Events 2022-2026 for this publisher)
  const eventTrendOption = useMemo<echarts.EChartsOption>(() => {
    if (!publisher) return {};
    const years = ['2022', '2023', '2024', '2025', '2026'];
    const rejData = years.map((yr) => publisher.annual_events[yr]?.rejected || 0);
    const accData = years.map((yr) => publisher.annual_events[yr]?.accepted || 0);
    const withdrData = years.map((yr) => publisher.annual_events[yr]?.withdrawn || 0);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['Rejected Event Records', 'Accepted Event Records', 'Withdrawn Event Records'],
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
      xAxis: {
        type: 'category',
        data: years,
        axisLabel: createCategoricalAxisLabelConfig(),
      },
      yAxis: {
        type: 'value',
        name: 'Record Volume',
        minInterval: 1,
      },
      series: [
        {
          name: 'Rejected Event Records',
          type: 'bar',
          data: rejData,
          itemStyle: { color: 'var(--sanguine)' },
        },
        {
          name: 'Accepted Event Records',
          type: 'bar',
          data: accData,
          itemStyle: { color: 'var(--leaf-green)' },
        },
        {
          name: 'Withdrawn Event Records',
          type: 'bar',
          data: withdrData,
          itemStyle: { color: 'var(--amber-gold)' },
        },
      ],
    };
  }, [publisher]);

  // SINTA Rank Distribution Chart for this publisher
  const sintaDistOption = useMemo<echarts.EChartsOption>(() => {
    if (!publisher) return {};
    const ranks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched', 'ambiguous'];
    const data = ranks.map((r) => publisher.sinta_ranks[r] || 0);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const rank = params.name;
          const count = params.value;
          const desc = getSintaRankTooltipDescription(rank);
          return `<strong>${formatSintaRankLabel(rank)}</strong>: ${count} journals<br/><span style="font-size: 11px; color: #888;">${desc}</span>`;
        },
      },
      grid: createCategoricalGridConfig({ bottom: '22%' }),
      xAxis: {
        type: 'category',
        data: ranks,
        axisLabel: createCategoricalAxisLabelConfig({ formatter: (val: string) => formatSintaRankLabel(val) }),
      },
      yAxis: {
        type: 'value',
        name: 'Journals',
        minInterval: 1,
      },
      series: [
        {
          type: 'bar',
          data: data.map((val, idx) => ({
            value: val,
            itemStyle: { color: getSintaRankColor(ranks[idx]) },
          })),
          barWidth: '50%',
          label: {
            show: true,
            position: 'top',
            fontSize: 11,
          },
        },
      ],
    };
  }, [publisher]);

  if (loading) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        <LoadingState message="Resolving publisher profile and journal portfolio..." />
      </div>
    );
  }

  if (error || !publisher) {
    return (
      <div className="container" style={{ padding: 'var(--space-8) 0' }}>
        <Alert
          type="warning"
          title="Publisher Profile Not Found"
        >
          {error || `No publisher record matches identifier "${publisherId}".`}
        </Alert>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <button type="button" className="btn btn-secondary" onClick={onBackToDirectory}>
            ← Back to Publisher Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Navigation Breadcrumb & Back Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onBackToDirectory}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}
          >
            ← Back to Publisher Directory
          </button>
          {onBackToPrevious && previousRouteLabel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBackToPrevious}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}
            >
              ← Back to {previousRouteLabel}
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleCopyLink}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 600 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copiedLink ? 'Copied Link!' : 'Copy Publisher Profile Link'}
        </button>
      </div>

      {/* Publisher Profile Header Card */}
      <section
        className="card"
        style={{
          background: 'var(--white)',
          padding: 'var(--space-6)',
          borderRadius: 'var(--radius-md)',
          borderLeft: '5px solid var(--sanguine)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span className="badge badge-neutral" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Publisher Entity
              </span>
              <span className="badge badge-neutral" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                {publisher.publisher_id}
              </span>
              <span
                className="badge"
                style={{
                  fontSize: '11px',
                  backgroundColor: publisher.identity_status === 'confirmed_same_publisher' ? 'rgba(46, 125, 50, 0.12)' : 'rgba(2, 136, 209, 0.12)',
                  color: publisher.identity_status === 'confirmed_same_publisher' ? '#2e7d32' : '#0288d1',
                  fontWeight: 600,
                }}
              >
                {publisher.identity_status === 'confirmed_same_publisher' ? 'Confirmed Same Publisher' : 'Exact Normalized Entity'}
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'var(--text-2xl)',
                color: 'var(--warm-black)',
                marginTop: 'var(--space-2)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {publisher.canonical_name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', marginTop: '4px' }}>
              <span>
                <strong>Country:</strong> {publisher.country || 'Indonesia'}
              </span>
              <span>
                <strong>Source:</strong> Authoritative DOAJ Archives (2022–2026) × SINTA Snapshot
              </span>
            </div>
          </div>
        </div>

        {/* Confirmed Aliases & Recorded Variants */}
        {publisher.aliases.length > 0 && (
          <div style={{ background: 'var(--sand-light)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--sand-medium)' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--dark-grey)', letterSpacing: '0.04em' }}>
              Confirmed Case & Whitespace Aliases ({publisher.aliases.length}):
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {publisher.aliases.map((alias, idx) => (
                <span
                  key={idx}
                  className="badge badge-neutral"
                  style={{ fontSize: 'var(--text-xs)', background: 'var(--white)', border: '1px solid var(--neutral-border)' }}
                >
                  {alias}
                </span>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--dark-grey)', margin: '6px 0 0 0', lineHeight: 1.4 }}>
              These variations appear across distinct historical DOAJ application exports and were reconciled conservatively through lossless Unicode and whitespace alignment.
            </p>
          </div>
        )}
      </section>

      {/* Publisher Profile KPIs (9 Core Indicators) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--dark-navy)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Distinct Journals
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--dark-navy)', marginTop: '4px' }}>
            {publisher.distinct_journal_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Total unique journal identities
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--sanguine)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Historical Rejected
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--sanguine)', marginTop: '4px' }}>
            {publisher.rejected_journal_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Portfolio: {((publisher.rejected_journal_count / (publisher.distinct_journal_count || 1)) * 100).toFixed(1)}% of journals
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--leaf-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Historical Accepted
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--leaf-green)', marginTop: '4px' }}>
            {publisher.accepted_journal_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Portfolio: {((publisher.accepted_journal_count / (publisher.distinct_journal_count || 1)) * 100).toFixed(1)}% of journals
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--amber-gold)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Historical Withdrawn
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--amber-gold)', marginTop: '4px' }}>
            {publisher.withdrawn_journal_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Portfolio: {((publisher.withdrawn_journal_count / (publisher.distinct_journal_count || 1)) * 100).toFixed(1)}% of journals
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--moss-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Currently Indexed
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--moss-green)', marginTop: '4px' }}>
            {publisher.currently_indexed_journal_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            DOAJ snapshot 15 Nov 2026
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--sinta-blue)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            SINTA-Matched
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--sinta-blue)', marginTop: '4px' }}>
            {publisher.sinta_matched_journal_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Share of portfolio: {((publisher.sinta_matched_journal_count / (publisher.distinct_journal_count || 1)) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--salmon)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Repeat Rejections
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--salmon)', marginTop: '4px' }}>
            {publisher.repeat_rejection_journal_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Journals rejected ≥2 times
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--leaf-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Verified R → A
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--leaf-green)', marginTop: '4px' }}>
            {publisher.verified_r_to_a_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Rejection followed by acceptance
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--dark-navy)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Verified W → A
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--dark-navy)', marginTop: '4px' }}>
            {publisher.verified_w_to_a_count.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Re-indexing after withdrawal
          </span>
        </div>
      </section>

      {/* Analytical Charts for this Publisher */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 'var(--space-4)' }}>
        <BaseEChart
          options={eventTrendOption}
          height={300}
          title={`Annual Event Volume (2022–2026): ${publisher.canonical_name}`}
          metricLabel="Event Record Volume"
          unit="Records"
          denominatorNote="Authoritative DOAJ Event Registries"
          scopeNote="2022–2026 Multi-Year Coverage"
          ariaLabel="Annual event trend bar chart for publisher"
        />

        <BaseEChart
          options={sintaDistOption}
          height={300}
          title={`SINTA Accreditation Tier Composition: ${publisher.canonical_name}`}
          metricLabel="Journals in Portfolio"
          unit="Unique Journals"
          denominatorNote={`Portfolio Universe: ${publisher.distinct_journal_count} Journals`}
          scopeNote="SINTA 15 Nov 2026 Snapshot"
          ariaLabel="SINTA rank distribution bar chart for publisher"
        />
      </div>

      {/* Publisher Journal Portfolio Section (Core Requirement #15) */}
      <section className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', color: 'var(--warm-black)', margin: 0 }}>
              Journals Published by This Publisher
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', margin: '4px 0 0 0' }}>
              Comprehensive journal portfolio associated with <strong>{publisher.canonical_name}</strong> across current DOAJ records and historical event observations.
              Clicking a journal title opens its detailed <strong>Journal Explorer</strong> profile.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportPortfolioCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Portfolio CSV ({sortedPortfolio.length})
          </button>
        </div>

        {/* Filters Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            alignItems: 'center',
            padding: 'var(--space-3)',
            background: 'var(--sand-light)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--sand-medium)',
          }}
        >
          <div style={{ flex: '1 1 240px', minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Search journal title, ISSN, or affiliation..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--neutral-border)',
                fontSize: 'var(--text-sm)',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="sinta-filter" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              SINTA:
            </label>
            <select
              id="sinta-filter"
              value={sintaFilter}
              onChange={(e) => {
                setSintaFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '6px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
            >
              <option value="all">All Tiers</option>
              <option value="S1">SINTA 1</option>
              <option value="S2">SINTA 2</option>
              <option value="S3">SINTA 3</option>
              <option value="S4">SINTA 4</option>
              <option value="S5">SINTA 5</option>
              <option value="S6">SINTA 6</option>
              <option value="NA">NA</option>
              <option value="unmatched">Unmatched</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="status-filter" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              DOAJ Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '6px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
            >
              <option value="all">All Statuses</option>
              <option value="currently_indexed">Currently Indexed</option>
              <option value="not_found">— (Not in Snapshot)</option>
              <option value="requires_review">Requires Review</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="event-filter" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              History:
            </label>
            <select
              id="event-filter"
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '6px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
            >
              <option value="all">All Histories</option>
              <option value="rejected">Has Rejected Event</option>
              <option value="accepted">Has Accepted Event</option>
              <option value="withdrawn">Has Withdrawn Event</option>
            </select>
          </div>

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginLeft: 'auto' }}>
            Showing <strong>{sortedPortfolio.length}</strong> of {portfolioJournals.length} journals
          </span>
        </div>

        {/* Portfolio Table */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-border)', borderRadius: 'var(--radius-sm)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--sand-light)', borderBottom: '2px solid var(--sand-medium)' }}>
                <SortableHeader columnKey="title" label="Journal Title" activeKey={sortKey} direction={direction} onSort={requestSort} />
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>ISSNs (P / E)</th>
                <SortableHeader columnKey="sinta" label="SINTA Rank" activeKey={sortKey} direction={direction} onSort={requestSort} align="center" />
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>SINTA Affiliation</th>
                <SortableHeader columnKey="rejected" label="Hist. Rejected" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="accepted" label="Hist. Accepted" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="withdrawn" label="Hist. Withdrawn" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="status" label="Current DOAJ Status" activeKey={sortKey} direction={direction} onSort={requestSort} align="center" />
                <th style={{ textAlign: 'left', padding: '10px 12px' }}>Relationship Scope</th>
                <th style={{ textAlign: 'center', padding: '10px 12px' }}>External Web</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPortfolio.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--dark-grey)' }}>
                    No journals match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedPortfolio.map((row: PortfolioJournalRow) => {
                  const statusInfo = formatCurrentDoajStatusBadge(row.current_doaj_status);
                  return (
                    <tr
                      key={row.journal_id}
                      style={{ borderBottom: '1px solid var(--sand-medium)' }}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        <button
                          type="button"
                          onClick={() => onNavigateToJournal(row.journal_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--sanguine)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            padding: 0,
                            textAlign: 'left',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            fontWeight: 600,
                          }}
                          title={`Open Journal Explorer profile for ${row.display_title}`}
                        >
                          {row.display_title}
                        </button>
                      </td>

                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                        {row.p_issn} / {row.e_issn}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <RankBadge rank={row.sinta_rank} />
                      </td>

                      <td style={{ padding: '10px 12px', fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', maxWidth: '180px' }}>
                        {row.sinta_affiliation}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: row.rejected_count > 0 ? 700 : 400, color: row.rejected_count > 0 ? 'var(--sanguine)' : 'inherit' }}>
                        {row.rejected_count || '—'}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: row.accepted_count > 0 ? 700 : 400, color: row.accepted_count > 0 ? 'var(--leaf-green)' : 'inherit' }}>
                        {row.accepted_count || '—'}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: row.withdrawn_count > 0 ? 700 : 400, color: row.withdrawn_count > 0 ? 'var(--amber-gold)' : 'inherit' }}>
                        {row.withdrawn_count || '—'}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span className={`badge ${statusInfo.badgeClass}`} style={statusInfo.style}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', fontSize: 'var(--text-xs)' }}>
                        <span
                          className="badge badge-neutral"
                          style={{
                            fontSize: '11px',
                            background: row.relationship_scope.includes('Current') ? 'rgba(46, 125, 50, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                            color: row.relationship_scope.includes('Current') ? '#2e7d32' : 'var(--dark-grey)',
                          }}
                        >
                          {row.relationship_scope}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {row.journal_url ? (
                          <a
                            href={row.journal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px', fontSize: '11px', textDecoration: 'none' }}
                            title="Open official journal website"
                          >
                            Visit ↗
                          </a>
                        ) : (
                          <span style={{ color: 'var(--mid-grey)', fontSize: 'var(--text-xs)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ fontSize: 'var(--text-xs)', padding: '4px 10px' }}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{ fontSize: 'var(--text-xs)', padding: '4px 10px' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
