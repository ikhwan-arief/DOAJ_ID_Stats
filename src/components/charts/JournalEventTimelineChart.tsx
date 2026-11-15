import React, { useMemo } from 'react';
import { BaseEChart } from './BaseEChart';
import { FactRejectedRecord, FactWithdrawnRecord, FactAcceptedRecord } from '../../types';
import * as echarts from '../../lib/echarts';

interface JournalTimelineProps {
  rejections: FactRejectedRecord[];
  withdrawals: FactWithdrawnRecord[];
  accepted?: FactAcceptedRecord[];
  journalTitle: string;
}

export const JournalEventTimelineChart: React.FC<JournalTimelineProps> = ({
  rejections,
  withdrawals,
  accepted = [],
  journalTitle,
}) => {
  const events = useMemo(() => {
    const list: Array<{
      date: string;
      year: number;
      type: 'Rejection' | 'Withdrawal' | 'Reinstatement' | 'Accepted Record';
      id: string;
      details: string;
      color: string;
    }> = [];

    rejections.forEach((r, idx) => {
      const d = r.event_day || (r.event_year ? `${r.event_year}-01-01` : '2022-01-01');
      list.push({
        date: d,
        year: r.event_year || parseInt(d.slice(0, 4), 10),
        type: 'Rejection',
        id: r.source_record_id,
        details: `Rejection Record #${idx + 1} (${r.source_record_id}) • Match: ${r.strict_match_status}`,
        color: '#982E0A', // --sanguine
      });
    });

    accepted.forEach((a, idx) => {
      const d = a.added_day || (a.added_year ? `${a.added_year}-01-01` : '2022-01-01');
      list.push({
        date: d,
        year: a.added_year || parseInt(d.slice(0, 4), 10),
        type: 'Accepted Record',
        id: a.source_record_id,
        details: `Accepted Application Record #${idx + 1} (${a.source_record_id}) • Catalog entry date (decision date unverified in source)`,
        color: '#245050', // --dark-navy / teal
      });
    });

    withdrawals.forEach((w) => {
      const d = w.last_withdrawn_day || (w.last_withdrawn_year ? `${w.last_withdrawn_year}-01-01` : '2022-01-01');
      list.push({
        date: d,
        year: w.last_withdrawn_year || parseInt(d.slice(0, 4), 10),
        type: 'Withdrawal',
        id: w.source_record_id,
        details: `Withdrawal Record (${w.source_record_id})`,
        color: '#3A5959', // --dark-green
      });

      if (w.last_reinstated_day) {
        list.push({
          date: w.last_reinstated_day,
          year: parseInt(w.last_reinstated_day.slice(0, 4), 10),
          type: 'Reinstatement',
          id: w.source_record_id,
          details: `Reinstatement Event (${w.source_record_id})`,
          color: '#47A178', // --mid-green
        });
      }
    });

    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [rejections, withdrawals, accepted]);

  const timelineOptions: echarts.EChartsOption = useMemo(() => {
    if (events.length === 0) return {};

    const dates = events.map((e) => e.date);
    const types = ['Rejection', 'Accepted Record', 'Withdrawal', 'Reinstatement'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const ev = events[params.dataIndex];
          return `<strong>${ev.type} Event</strong><br/>Date: ${ev.date}<br/>${ev.details}`;
        },
      },
      legend: {
        data: types,
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
          name: 'Chronological Events',
          type: 'scatter',
          symbolSize: (_: any, params: any) => {
            const ev = events[params.dataIndex];
            return ev.type === 'Rejection' ? 24 : 20;
          },
          data: events.map((ev) => ({
            value: [ev.date, 'Events'],
            itemStyle: { color: ev.color },
          })),
          label: {
            show: true,
            formatter: (params: any) => events[params.dataIndex].type,
            position: 'top',
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            fontWeight: 600,
          },
        },
      ],
    };
  }, [events]);

  if (events.length === 0) {
    return null;
  }

  return (
    <BaseEChart
      title={`Chronological Application & Delisting Timeline: ${journalTitle}`}
      metricLabel="Sequential Historical Events"
      unit="dated events"
      denominatorNote={`${events.length} recorded events`}
      scopeNote="Visual chronological trace of review outcomes"
      options={timelineOptions}
      height={220}
      ariaLabel={`Chronological scatter timeline of DOAJ events for ${journalTitle}`}
    />
  );
};
