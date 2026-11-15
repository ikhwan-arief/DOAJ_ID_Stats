import React, { useMemo } from 'react';
import { BaseEChart } from './BaseEChart';
import { FactRejectedRecord, FactWithdrawnRecord, FactAcceptedRecord } from '../../types';
import { formatMatchStatus } from '../../lib/matchingLabels';
import * as echarts from '../../lib/echarts';

interface JournalTimelineProps {
  rejections: FactRejectedRecord[];
  withdrawals: FactWithdrawnRecord[];
  accepted?: FactAcceptedRecord[];
  isCurrentlyIndexed?: boolean;
  journalTitle: string;
}

export const JournalEventTimelineChart: React.FC<JournalTimelineProps> = ({
  rejections,
  withdrawals,
  accepted = [],
  isCurrentlyIndexed = false,
  journalTitle,
}) => {
  const events = useMemo(() => {
    const list: Array<{
      date: string;
      year: number;
      type: 'Rejected' | 'Accepted' | 'Withdrawn' | 'Recorded Return to DOAJ' | 'Currently Indexed';
      id: string;
      details: string;
      color: string;
    }> = [];

    // 1. Rejected historical events (chronologically dated)
    rejections.forEach((r, idx) => {
      const d = r.event_day || (r.event_year ? `${r.event_year}-01-01` : '2022-01-01');
      list.push({
        date: d,
        year: r.event_year || parseInt(d.slice(0, 4), 10),
        type: 'Rejected',
        id: r.source_record_id,
        details: `Rejection Record #${idx + 1} (${r.source_record_id}) • Match: ${formatMatchStatus(r.strict_match_status)}`,
        color: '#982E0A', // --sanguine
      });
    });

    // 2. Accepted historical records: ONLY add if decision_date_verified is true
    // Otherwise, accepted records with unverified decision dates belong in the undated section
    accepted.forEach((a, idx) => {
      if (a.decision_date_verified && a.added_day) {
        list.push({
          date: a.added_day,
          year: a.added_year || parseInt(a.added_day.slice(0, 4), 10),
          type: 'Accepted',
          id: a.source_record_id,
          details: `Accepted Application Record #${idx + 1} (${a.source_record_id}) • Verified Decision Date`,
          color: '#245050', // --dark-navy / teal
        });
      }
    });

    // 3. Withdrawn historical events
    withdrawals.forEach((w) => {
      const d = w.last_withdrawn_day || (w.last_withdrawn_year ? `${w.last_withdrawn_year}-01-01` : '2022-01-01');
      list.push({
        date: d,
        year: w.last_withdrawn_year || parseInt(d.slice(0, 4), 10),
        type: 'Withdrawn',
        id: w.source_record_id,
        details: `Withdrawal Record (${w.source_record_id})`,
        color: '#3A5959', // --dark-green
      });

      // Distinct historical annotation: Recorded Return to DOAJ
      if (w.last_reinstated_day) {
        list.push({
          date: w.last_reinstated_day,
          year: parseInt(w.last_reinstated_day.slice(0, 4), 10),
          type: 'Recorded Return to DOAJ',
          id: w.source_record_id,
          details: `Recorded Return to DOAJ Annotation (${w.source_record_id}) • Source: Withdrawn Registry Date`,
          color: '#47A178', // --mid-green
        });
      }
    });

    // Sort chronologically
    list.sort((a, b) => a.date.localeCompare(b.date));

    // 4. Terminal observation: Currently Indexed (Dated 15 November 2026)
    if (isCurrentlyIndexed) {
      list.push({
        date: '2026-11-15',
        year: 2026,
        type: 'Currently Indexed',
        id: 'snapshot-2026-11-15',
        details: 'Currently Indexed — 15 November 2026 • Verified Indonesian DOAJ Snapshot Observation (Terminal Observation)',
        color: '#1B6A45', // distinctive deep green
      });
    }

    return list;
  }, [rejections, withdrawals, accepted, isCurrentlyIndexed]);

  const timelineOptions: echarts.EChartsOption = useMemo(() => {
    if (events.length === 0) return {};

    const dates = events.map((e) => e.date);
    const types = ['Rejected', 'Accepted', 'Withdrawn', 'Recorded Return to DOAJ', 'Currently Indexed'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const ev = events[params.dataIndex];
          const isObservation = ev.type === 'Currently Indexed';
          return `<strong>${isObservation ? 'Snapshot Observation' : `${ev.type} Event`}</strong><br/>Date: ${ev.date}<br/>${ev.details}`;
        },
      },
      legend: {
        data: types.filter((t) => events.some((e) => e.type === t)),
        bottom: 0,
        textStyle: { fontFamily: 'var(--font-sans)', fontSize: 11 },
      },
      grid: { left: '4%', right: '5%', top: '15%', bottom: '20%', containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { fontFamily: 'var(--font-mono)', fontSize: 11, rotate: dates.length > 5 ? 30 : 0 },
      },
      yAxis: {
        type: 'category',
        data: ['Events'],
        show: false,
      },
      series: [
        {
          name: 'Journal History',
          type: 'line',
          step: false,
          data: events.map((e) => ({
            value: 0,
            symbol: e.type === 'Currently Indexed' ? 'diamond' : 'circle',
            symbolSize: e.type === 'Currently Indexed' ? 16 : 12,
            itemStyle: { color: e.color, borderColor: '#fff', borderWidth: 2 },
          })),
          lineStyle: { color: 'var(--neutral-border)', width: 2, type: 'dashed' },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              const ev = events[params.dataIndex];
              return ev.type;
            },
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            color: 'var(--warm-black)',
          },
        },
      ],
    };
  }, [events]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="card" style={{ padding: 'var(--space-4)' }}>
      <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-md)', margin: '0 0 var(--space-2) 0' }}>
        Chronological Event Timeline & Snapshot Status: {journalTitle}
      </h4>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginBottom: 'var(--space-3)' }}>
        Chronological sequence of verified historical application decisions (Rejected, Accepted, Withdrawn) and recorded returns,
        followed by terminal current DOAJ indexing snapshot observation where confirmed.
      </p>
      <BaseEChart
        options={timelineOptions}
        height={220}
        title=""
        metricLabel="Event Sequence"
        unit="Event"
        denominatorNote="Verified dated records"
        scopeNote="DOAJ 2022–2026 Archive & Snapshot 15 Nov 2026"
        ariaLabel={`Chronological event timeline for ${journalTitle}`}
      />
    </div>
  );
};
