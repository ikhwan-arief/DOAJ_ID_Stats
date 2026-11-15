/**
 * Publisher Analysis Page Component (Primary Route 7: #/publishers).
 * Displays publisher-level KPIs, 6 analytical charts with Download PNG,
 * and a searchable, sortable, paginated publisher directory table with CSV export.
 *
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { loadDimPublishers, loadPublisherSummary } from '../data/loader';
import { PublisherRecord, PublisherSummary, GlobalFilterState } from '../types';
import { Alert, LoadingState } from '../components/common/UIPrimitives';
import { SortableHeader, useSortableData } from '../components/common/SortableTable';
import { BaseEChart } from '../components/charts/BaseEChart';
import {
  formatSintaRankLabel,
  getSintaRankColor,
  createCategoricalAxisLabelConfig,
} from '../lib/chartAxisConfig';
import * as echarts from '../lib/echarts';

interface PublisherAnalysisPageProps {
  filters?: GlobalFilterState;
  onSelectPublisher: (publisherId: string) => void;
}

export const PublisherAnalysisPage: React.FC<PublisherAnalysisPageProps> = ({
  filters,
  onSelectPublisher,
}) => {
  const [publishers, setPublishers] = useState<PublisherRecord[] | null>(null);
  const [summary, setSummary] = useState<PublisherSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Table filter and pagination controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Column visibility controls: simplified default columns
  const [showCountry, setShowCountry] = useState<boolean>(false);
  const [showAccepted, setShowAccepted] = useState<boolean>(false);
  const [showSintaMatched, setShowSintaMatched] = useState<boolean>(false);
  const [showIdentityStatus, setShowIdentityStatus] = useState<boolean>(false);

  // Chart controls
  const [topLimit, setTopLimit] = useState<number>(10);
  const [rejectionMetric, setRejectionMetric] = useState<'journals' | 'records'>('journals');

  useEffect(() => {
    Promise.all([loadDimPublishers(), loadPublisherSummary()])
      .then(([pubs, sum]) => {
        setPublishers(pubs);
        setSummary(sum);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load publisher analysis data');
        setLoading(false);
      });
  }, []);

  // Distinct countries in dataset for filter dropdown
  const availableCountries = useMemo(() => {
    if (!publishers) return [];
    const set = new Set<string>();
    publishers.forEach((p) => {
      if (p.country) set.add(p.country);
    });
    return Array.from(set).sort();
  }, [publishers]);

  // Filtered publishers table list (incorporating global filters if provided)
  const filteredPublishers = useMemo(() => {
    if (!publishers) return [];
    return publishers.filter((p) => {
      // Local filters
      if (countryFilter !== 'all' && (p.country || 'Indonesia') !== countryFilter) return false;
      if (historyFilter === 'rejected' && p.rejected_journal_count === 0) return false;
      if (historyFilter === 'accepted' && p.accepted_journal_count === 0) return false;
      if (historyFilter === 'withdrawn' && p.withdrawn_journal_count === 0) return false;
      if (statusFilter === 'currently_indexed' && p.currently_indexed_journal_count === 0) return false;
      if (statusFilter === 'not_indexed' && p.currently_indexed_journal_count > 0) return false;

      // Global filter: sintaRank
      if (filters?.sintaRank && filters.sintaRank !== 'all') {
        const countForRank = p.sinta_ranks[filters.sintaRank] || 0;
        if (countForRank === 0) return false;
      }

      // Global filter: eventKind
      if (filters?.eventKind && filters.eventKind !== 'all') {
        if (filters.eventKind === 'rejected' && p.rejected_journal_count === 0) return false;
        if (filters.eventKind === 'withdrawn' && p.withdrawn_journal_count === 0) return false;
      }

      // Global filter: currentDoajStatus
      if (filters?.currentDoajStatus && filters.currentDoajStatus !== 'all') {
        if (filters.currentDoajStatus === 'currently_indexed' && p.currently_indexed_journal_count === 0) return false;
        if (filters.currentDoajStatus === 'not_found' && p.currently_indexed_journal_count > 0) return false;
      }

      // Search query (combines local search and global search if present)
      const effectiveSearch = (searchQuery.trim() || filters?.searchQuery?.trim() || '').toLowerCase();
      if (effectiveSearch) {
        const nameMatch = p.canonical_name.toLowerCase().includes(effectiveSearch);
        const aliasMatch = p.aliases.some((a) => a.toLowerCase().includes(effectiveSearch));
        const idMatch = p.publisher_id.toLowerCase().includes(effectiveSearch);
        if (!nameMatch && !aliasMatch && !idMatch) return false;
      }
      return true;
    });
  }, [publishers, countryFilter, historyFilter, statusFilter, searchQuery, filters]);

  const publisherSortAccessors = useMemo(() => ({
    name: (p: PublisherRecord) => p.canonical_name,
    country: (p: PublisherRecord) => p.country || 'Indonesia',
    distinct: (p: PublisherRecord) => p.distinct_journal_count,
    rejected: (p: PublisherRecord) => p.rejected_journal_count,
    accepted: (p: PublisherRecord) => p.accepted_journal_count,
    withdrawn: (p: PublisherRecord) => p.withdrawn_journal_count,
    current: (p: PublisherRecord) => p.currently_indexed_journal_count,
    sinta: (p: PublisherRecord) => p.sinta_matched_journal_count,
  }), []);

  const {
    sortedItems: sortedPublishers,
    sortKey,
    direction,
    requestSort,
  } = useSortableData(filteredPublishers, publisherSortAccessors, 'distinct', 'desc');

  const totalPages = Math.ceil(sortedPublishers.length / pageSize) || 1;
  const paginatedPublishers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPublishers.slice(start, start + pageSize);
  }, [sortedPublishers, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (sortedPublishers.length === 0) return;
    const headers = [
      'Publisher ID',
      'Publisher Name',
      'Aliases',
      'Country',
      'Identity Status',
      'Distinct Journals',
      'Rejected Journals',
      'Accepted Journals',
      'Withdrawn Journals',
      'Currently Indexed Journals',
      'SINTA-Matched Journals',
      'Rejection Record Volume',
      'Accepted Record Volume',
      'Withdrawn Record Volume',
    ];
    const csvRows = [headers.join(',')];
    sortedPublishers.forEach((p: PublisherRecord) => {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      csvRows.push([
        escape(p.publisher_id),
        escape(p.canonical_name),
        escape(p.aliases.join('; ')),
        escape(p.country || 'Indonesia'),
        escape(p.identity_status),
        p.distinct_journal_count,
        p.rejected_journal_count,
        p.accepted_journal_count,
        p.withdrawn_journal_count,
        p.currently_indexed_journal_count,
        p.sinta_matched_journal_count,
        p.event_records.rejected,
        p.event_records.accepted,
        p.event_records.withdrawn,
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `publisher_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Top publishers subset for analytical charts
  const topPublishers = useMemo(() => {
    if (!publishers) return [];
    return publishers.slice(0, topLimit);
  }, [publishers, topLimit]);

  // Chart A: Top Publishers by Distinct Journal Count
  const chartAOption = useMemo<echarts.EChartsOption>(() => {
    const sorted = [...topPublishers].reverse();
    const names = sorted.map((p) => p.canonical_name);
    const values = sorted.map((p) => p.distinct_journal_count);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const pt = Array.isArray(params) ? params[0] : params;
          return `<strong>${pt.name}</strong><br/>Distinct Associated Journals: <strong>${pt.value}</strong>`;
        },
      },
      grid: { left: '3%', right: '8%', bottom: '5%', top: '5%', containLabel: true },
      xAxis: { type: 'value', name: 'Distinct Journals', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          interval: 0,
          width: 220,
          overflow: 'truncate',
          formatter: (value: string) => (value.length > 32 ? `${value.slice(0, 30)}…` : value),
        },
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: { color: 'var(--dark-navy)' },
          label: { show: true, position: 'right', fontSize: 11 },
        },
      ],
    };
  }, [topPublishers]);

  // Chart B: Rejected Journals or Records by Publisher
  const chartBOption = useMemo<echarts.EChartsOption>(() => {
    const list = [...(publishers || [])]
      .sort((a, b) =>
        rejectionMetric === 'journals'
          ? b.rejected_journal_count - a.rejected_journal_count
          : b.event_records.rejected - a.event_records.rejected
      )
      .slice(0, topLimit)
      .reverse();

    const names = list.map((p) => p.canonical_name);
    const values = list.map((p) =>
      rejectionMetric === 'journals' ? p.rejected_journal_count : p.event_records.rejected
    );

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const pt = Array.isArray(params) ? params[0] : params;
          const unit = rejectionMetric === 'journals' ? 'Distinct Journals' : 'Rejection Records';
          return `<strong>${pt.name}</strong><br/>${unit}: <strong>${pt.value}</strong>`;
        },
      },
      grid: { left: '3%', right: '8%', bottom: '5%', top: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        name: rejectionMetric === 'journals' ? 'Distinct Journals' : 'Rejection Records',
        minInterval: 1,
      },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          interval: 0,
          width: 220,
          overflow: 'truncate',
          formatter: (value: string) => (value.length > 32 ? `${value.slice(0, 30)}…` : value),
        },
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: { color: 'var(--sanguine)' },
          label: { show: true, position: 'right', fontSize: 11 },
        },
      ],
    };
  }, [publishers, topLimit, rejectionMetric]);

  // Chart C: Withdrawn Journals by Publisher
  const chartCOption = useMemo<echarts.EChartsOption>(() => {
    const list = [...(publishers || [])]
      .sort((a, b) => b.withdrawn_journal_count - a.withdrawn_journal_count)
      .slice(0, topLimit)
      .reverse();

    const names = list.map((p) => p.canonical_name);
    const values = list.map((p) => p.withdrawn_journal_count);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const pt = Array.isArray(params) ? params[0] : params;
          return `<strong>${pt.name}</strong><br/>Distinct Withdrawn Journals: <strong>${pt.value}</strong>`;
        },
      },
      grid: { left: '3%', right: '8%', bottom: '5%', top: '5%', containLabel: true },
      xAxis: { type: 'value', name: 'Distinct Withdrawn Journals', minInterval: 1 },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          interval: 0,
          width: 220,
          overflow: 'truncate',
          formatter: (value: string) => (value.length > 32 ? `${value.slice(0, 30)}…` : value),
        },
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: { color: 'var(--amber-gold)' },
          label: { show: true, position: 'right', fontSize: 11 },
        },
      ],
    };
  }, [publishers, topLimit]);

  // Chart D: Publisher Lifecycle Composition (Grouped Bar, non-additive)
  const chartDOption = useMemo<echarts.EChartsOption>(() => {
    const topPubs = topPublishers.slice(0, Math.min(topLimit, 10));
    const names = topPubs.map((p) => p.canonical_name);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        data: ['Hist. Rejected', 'Hist. Accepted', 'Hist. Withdrawn', 'Currently Indexed'],
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '18%', top: '12%', containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: {
          interval: 0,
          rotate: 25,
          formatter: (val: string) => (val.length > 18 ? `${val.slice(0, 16)}…` : val),
        },
      },
      yAxis: {
        type: 'value',
        name: 'Distinct Journals',
        minInterval: 1,
      },
      series: [
        {
          name: 'Hist. Rejected',
          type: 'bar',
          data: topPubs.map((p) => p.rejected_journal_count),
          itemStyle: { color: 'var(--sanguine)' },
        },
        {
          name: 'Hist. Accepted',
          type: 'bar',
          data: topPubs.map((p) => p.accepted_journal_count),
          itemStyle: { color: 'var(--leaf-green)' },
        },
        {
          name: 'Hist. Withdrawn',
          type: 'bar',
          data: topPubs.map((p) => p.withdrawn_journal_count),
          itemStyle: { color: 'var(--amber-gold)' },
        },
        {
          name: 'Currently Indexed',
          type: 'bar',
          data: topPubs.map((p) => p.currently_indexed_journal_count),
          itemStyle: { color: 'var(--moss-green)' },
        },
      ],
    };
  }, [topPublishers, topLimit]);

  // Chart E: SINTA Rank Distribution for Top Publishers (Stacked / Grouped distribution)
  const chartEOption = useMemo<echarts.EChartsOption>(() => {
    const topPubs = topPublishers.slice(0, Math.min(topLimit, 8));
    const ranks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched', 'ambiguous'];

    const series = ranks.map((rank) => ({
      name: formatSintaRankLabel(rank),
      type: 'bar' as const,
      stack: 'total',
      itemStyle: { color: getSintaRankColor(rank) },
      data: topPubs.map((p) => p.sinta_ranks[rank] || 0),
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      legend: {
        type: 'scroll',
        top: 0,
      },
      grid: { left: '3%', right: '4%', bottom: '18%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: topPubs.map((p) => p.canonical_name),
        axisLabel: {
          interval: 0,
          rotate: 25,
          formatter: (val: string) => (val.length > 18 ? `${val.slice(0, 16)}…` : val),
        },
      },
      yAxis: {
        type: 'value',
        name: 'Associated Journals',
        minInterval: 1,
      },
      series,
    };
  }, [topPublishers, topLimit]);

  // Chart F: Aggregate Annual Historical Event Trends (2022-2026) for Top Publishers Group
  const chartFOption = useMemo<echarts.EChartsOption>(() => {
    const years = ['2022', '2023', '2024', '2025', '2026'];
    const rejByYear = years.map((yr) =>
      topPublishers.reduce((acc, p) => acc + (p.annual_events[yr]?.rejected || 0), 0)
    );
    const accByYear = years.map((yr) =>
      topPublishers.reduce((acc, p) => acc + (p.annual_events[yr]?.accepted || 0), 0)
    );
    const withdrByYear = years.map((yr) =>
      topPublishers.reduce((acc, p) => acc + (p.annual_events[yr]?.withdrawn || 0), 0)
    );

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
          data: rejByYear,
          itemStyle: { color: 'var(--sanguine)' },
        },
        {
          name: 'Accepted Event Records',
          type: 'bar',
          data: accByYear,
          itemStyle: { color: 'var(--leaf-green)' },
        },
        {
          name: 'Withdrawn Event Records',
          type: 'bar',
          data: withdrByYear,
          itemStyle: { color: 'var(--amber-gold)' },
        },
      ],
    };
  }, [topPublishers]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8) 0' }}>
        <LoadingState message="Loading publisher intelligence and directory..." />
      </div>
    );
  }

  if (error || !summary || !publishers) {
    return (
      <div style={{ padding: 'var(--space-8) 0' }}>
        <Alert
          type="warning"
          title="Publisher Analysis Unavailable"
        >
          {error || 'Failed to load publisher datasets.'}
        </Alert>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Route Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="badge badge-neutral" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Observatory Dashboard • Route 7
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
            Snapshot Observation: 15 November 2026
          </span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-2xl)', color: 'var(--warm-black)', margin: 'var(--space-1) 0' }}>
          Publisher Intelligence & Publisher Directory
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', maxWidth: '900px', lineHeight: 1.5, margin: 0 }}>
          Comprehensive institutional and commercial publisher intelligence derived from authoritative DOAJ archives (2022–2026) and national SINTA registry reconciliation.
          Explore resolved publishing entities, historical event patterns, and linked journal portfolios.
        </p>
      </div>

      {/* KPI Overview Cards (6 Core Headline Metrics) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--dark-navy)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Resolved Publishers
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--dark-navy)', marginTop: '4px' }}>
            {summary.total_resolved_publishers.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Exact normalized identities
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--sanguine)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            With Rejected Journals
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--sanguine)', marginTop: '4px' }}>
            {summary.publishers_with_rejected.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            {((summary.publishers_with_rejected / summary.total_resolved_publishers) * 100).toFixed(1)}% of publishers
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--leaf-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            With Accepted Journals
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--leaf-green)', marginTop: '4px' }}>
            {summary.publishers_with_accepted.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            {((summary.publishers_with_accepted / summary.total_resolved_publishers) * 100).toFixed(1)}% of publishers
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--amber-gold)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            With Withdrawn Journals
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--amber-gold)', marginTop: '4px' }}>
            {summary.publishers_with_withdrawn.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            {((summary.publishers_with_withdrawn / summary.total_resolved_publishers) * 100).toFixed(1)}% of publishers
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--moss-green)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            Currently Indexed DOAJ
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--moss-green)', marginTop: '4px' }}>
            {summary.publishers_with_current_doaj.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Active on 15 Nov 2026
          </span>
        </div>

        <div className="card" style={{ padding: 'var(--space-4)', borderTop: '4px solid var(--sinta-blue)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', textTransform: 'uppercase', fontWeight: 600 }}>
            SINTA-Matched Journals
          </span>
          <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--sinta-blue)', marginTop: '4px' }}>
            {summary.publishers_with_sinta.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--dark-grey)' }}>
            Publishers with SINTA link
          </span>
        </div>
      </section>

      {/* Analytical Charts Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-lg)', color: 'var(--warm-black)', margin: 0 }}>
          Publisher Analytical Visualizations
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="top-limit" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              Top Publishers:
            </label>
            <select
              id="top-limit"
              value={topLimit}
              onChange={(e) => setTopLimit(Number(e.target.value))}
              style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="rejection-metric" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              Rejection Chart Unit:
            </label>
            <select
              id="rejection-metric"
              value={rejectionMetric}
              onChange={(e) => setRejectionMetric(e.target.value as 'journals' | 'records')}
              style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
            >
              <option value="journals">Distinct Journals</option>
              <option value="records">Rejection Record Volume</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of 6 Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Chart A */}
        <BaseEChart
          options={chartAOption}
          height={320}
          title={`Top ${topLimit} Publishers by Distinct Associated Journals`}
          metricLabel="Distinct Reconciled Journals"
          unit="Journals"
          denominatorNote="Publisher Distinct Journal Portfolio"
          scopeNote="2022–2026 DOAJ Archive × SINTA Snapshot"
          ariaLabel="Top publishers by distinct journal count bar chart"
        />

        {/* Chart B */}
        <BaseEChart
          options={chartBOption}
          height={320}
          title={`Top ${topLimit} Publishers by Historical Rejected ${rejectionMetric === 'journals' ? 'Journals' : 'Record Volume'}`}
          metricLabel={rejectionMetric === 'journals' ? 'Distinct Rejected Journals' : 'Rejection Event Records'}
          unit={rejectionMetric === 'journals' ? 'Journals' : 'Records'}
          denominatorNote="Authoritative Rejected Application Registry (9,308 Records)"
          scopeNote="2022–2026 Historical DOAJ Decisions"
          ariaLabel="Rejected journals by publisher bar chart"
        />

        {/* Chart C */}
        <BaseEChart
          options={chartCOption}
          height={320}
          title={`Top ${topLimit} Publishers by Distinct Historically Withdrawn Journals`}
          metricLabel="Distinct Withdrawn Journals"
          unit="Journals"
          denominatorNote="Authoritative Withdrawn Export (661 Records)"
          scopeNote="2022–2026 Historical Withdrawals"
          ariaLabel="Withdrawn journals by publisher bar chart"
        />

        {/* Chart D */}
        <BaseEChart
          options={chartDOption}
          height={320}
          title={`Publisher Lifecycle Composition (Top ${Math.min(topLimit, 10)} Publishers)`}
          metricLabel="Unique Journals per Category"
          unit="Distinct Journals"
          denominatorNote="Overlapping Lifecycle Observations (Non-Additive)"
          scopeNote="Grouped Historical & Terminal Observations"
          ariaLabel="Publisher lifecycle composition grouped bar chart"
        />

        {/* Chart E */}
        <BaseEChart
          options={chartEOption}
          height={320}
          title={`SINTA Accreditation Tier Composition (Top ${Math.min(topLimit, 8)} Publishers)`}
          metricLabel="Associated Journals by SINTA Rank"
          unit="Journals"
          denominatorNote="All Ranks S1–S6, NA, Unmatched, Ambiguous"
          scopeNote="SINTA Snapshot 15 Nov 2026"
          ariaLabel="Publisher SINTA rank distribution chart"
        />

        {/* Chart F */}
        <BaseEChart
          options={chartFOption}
          height={320}
          title={`Annual Event Record Volumes (2022–2026): Top ${topLimit} Publishers Group`}
          metricLabel="Annual Event Record Volume"
          unit="Records"
          denominatorNote="Aggregated DOAJ Event Logs for Selected Group"
          scopeNote="Annual Decisions 2022–2026"
          ariaLabel="Annual event trends for publisher comparison group"
        />
      </div>

      {/* Searchable Publisher Directory Section */}
      <section className="card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', color: 'var(--warm-black)', margin: 0 }}>
              Searchable Publisher Directory
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--dark-grey)', margin: '4px 0 0 0' }}>
              Directory of <strong>{summary.total_resolved_publishers.toLocaleString()}</strong> reconciled publishing entities.
              Sortable by all numeric metrics. Click <strong>View Profile</strong> or publisher name to inspect complete journal portfolios.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Directory CSV ({sortedPublishers.length})
          </button>
        </div>

        {/* Filter Controls Toolbar */}
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
          <div style={{ flex: '1 1 240px', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search publisher name, confirmed alias, or ID..."
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
            <label htmlFor="country-filter" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              Country:
            </label>
            <select
              id="country-filter"
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '6px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
            >
              <option value="all">All Countries</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="hist-filter" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              History:
            </label>
            <select
              id="hist-filter"
              value={historyFilter}
              onChange={(e) => {
                setHistoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '6px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
            >
              <option value="all">All Publishers</option>
              <option value="rejected">Has Rejected Journals</option>
              <option value="accepted">Has Accepted Journals</option>
              <option value="withdrawn">Has Withdrawn Journals</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="cur-status-filter" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
              DOAJ Status:
            </label>
            <select
              id="cur-status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '6px 8px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
            >
              <option value="all">All</option>
              <option value="currently_indexed">Currently Indexed (≥1 Journal)</option>
              <option value="not_indexed">Not Currently Indexed (0 Journals)</option>
            </select>
          </div>

          {/* Optional Columns Visibility Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--dark-grey)', textTransform: 'uppercase' }}>
              Columns:
            </span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showCountry} onChange={(e) => setShowCountry(e.target.checked)} />
              Country
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showAccepted} onChange={(e) => setShowAccepted(e.target.checked)} />
              Accepted
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showSintaMatched} onChange={(e) => setShowSintaMatched(e.target.checked)} />
              SINTA Matched
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', cursor: 'pointer' }}>
              <input type="checkbox" checked={showIdentityStatus} onChange={(e) => setShowIdentityStatus(e.target.checked)} />
              Identity Status
            </label>
          </div>

          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginLeft: 'auto' }}>
            Showing <strong>{sortedPublishers.length}</strong> of {publishers.length} publishers
          </span>
        </div>

        {/* Table View */}
        <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-border)', borderRadius: 'var(--radius-sm)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ background: 'var(--sand-light)', borderBottom: '2px solid var(--sand-medium)' }}>
                <SortableHeader columnKey="name" label="Publisher Name" activeKey={sortKey} direction={direction} onSort={requestSort} />
                {showCountry && <SortableHeader columnKey="country" label="Country" activeKey={sortKey} direction={direction} onSort={requestSort} />}
                <SortableHeader columnKey="distinct" label="Distinct Journals" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="rejected" label="Rejected Journals" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                {showAccepted && <SortableHeader columnKey="accepted" label="Accepted Journals" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />}
                <SortableHeader columnKey="withdrawn" label="Withdrawn Journals" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                <SortableHeader columnKey="current" label="Currently Indexed" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />
                {showSintaMatched && <SortableHeader columnKey="sinta" label="SINTA Matched" activeKey={sortKey} direction={direction} onSort={requestSort} align="right" />}
                {showIdentityStatus && <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Identity Status</th>}
                <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPublishers.length === 0 ? (
                <tr>
                  <td colSpan={6 + (showCountry ? 1 : 0) + (showAccepted ? 1 : 0) + (showSintaMatched ? 1 : 0) + (showIdentityStatus ? 1 : 0)} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--dark-grey)' }}>
                    No publisher entities match the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedPublishers.map((p: PublisherRecord) => (
                  <tr
                    key={p.publisher_id}
                    style={{ borderBottom: '1px solid var(--sand-medium)' }}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                      <button
                        type="button"
                        onClick={() => onSelectPublisher(p.publisher_id)}
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
                        title={`View publisher profile for ${p.canonical_name}`}
                      >
                        {p.canonical_name}
                      </button>
                    </td>

                    {showCountry && (
                      <td style={{ padding: '10px 12px', fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
                        {p.country || 'Indonesia'}
                      </td>
                    )}

                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {p.distinct_journal_count.toLocaleString()}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: p.rejected_journal_count > 0 ? 'var(--sanguine)' : 'inherit' }}>
                      {p.rejected_journal_count.toLocaleString()}
                    </td>

                    {showAccepted && (
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: p.accepted_journal_count > 0 ? 'var(--leaf-green)' : 'inherit' }}>
                        {p.accepted_journal_count.toLocaleString()}
                      </td>
                    )}

                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: p.withdrawn_journal_count > 0 ? 'var(--amber-gold)' : 'inherit' }}>
                      {p.withdrawn_journal_count.toLocaleString()}
                    </td>

                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', color: p.currently_indexed_journal_count > 0 ? 'var(--moss-green)' : 'var(--mid-grey)' }}>
                      {p.currently_indexed_journal_count.toLocaleString()}
                    </td>

                    {showSintaMatched && (
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {p.sinta_matched_journal_count.toLocaleString()}
                      </td>
                    )}

                    {showIdentityStatus && (
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '11px',
                            backgroundColor: p.identity_status === 'confirmed_same_publisher' ? 'rgba(46, 125, 50, 0.12)' : 'rgba(2, 136, 209, 0.12)',
                            color: p.identity_status === 'confirmed_same_publisher' ? '#2e7d32' : '#0288d1',
                            fontWeight: 600,
                          }}
                        >
                          {p.identity_status === 'confirmed_same_publisher' ? 'Confirmed Same' : 'Exact Entity'}
                        </span>
                      </td>
                    )}

                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onSelectPublisher(p.publisher_id)}
                        style={{ padding: '3px 9px', fontSize: 'var(--text-xs)', fontWeight: 600 }}
                      >
                        View Profile →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({sortedPublishers.length} total publishers)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label htmlFor="pub-page-size" style={{ fontSize: '11px', color: 'var(--dark-grey)', fontWeight: 600 }}>
                Rows per page:
              </label>
              <select
                id="pub-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: '2px 6px', fontSize: '11px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--neutral-border)' }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          {totalPages > 1 && (
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
          )}
        </div>
      </section>
    </div>
  );
};
