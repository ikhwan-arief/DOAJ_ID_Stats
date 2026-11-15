import React from 'react';
import { IntersectionsPublic } from '../../types';

interface UpsetChartProps {
  data: IntersectionsPublic;
  onSelectRegion?: (region: string) => void;
}

export const UpsetVennChart: React.FC<UpsetChartProps> = ({ data, onSelectRegion }) => {
  const aggregates = data.upset_aggregates;
  const sets = [
    { key: 'R', label: 'DOAJ Rejected (R)', color: 'var(--sanguine)', count: aggregates.filter((item) => item.R).reduce((sum, item) => sum + item.count, 0) },
    { key: 'W', label: 'DOAJ Withdrawn (W)', color: 'var(--dark-green)', count: aggregates.filter((item) => item.W).reduce((sum, item) => sum + item.count, 0) },
    { key: 'S', label: 'SINTA Population (S)', color: 'var(--mid-green)', count: aggregates.filter((item) => item.S).reduce((sum, item) => sum + item.count, 0) },
  ];
  const universeCount = aggregates.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(1, ...aggregates.map((a) => a.count));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Set Size Sidebar + Bar chart representing UpSet Intersections */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-4)',
          alignItems: 'end',
        }}
      >
        {/* Set Marginals */}
        <div
          style={{
            backgroundColor: 'var(--light-grey)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--neutral-border)',
          }}
        >
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
            Set Marginal Universes (Unique Journals)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {sets.map((s) => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                <span style={{ fontWeight: 600, color: s.color }}>● {s.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {s.count.toLocaleString()} journals
                </span>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed var(--neutral-border)', paddingTop: 'var(--space-1)', marginTop: 'var(--space-1)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ fontStyle: 'italic', color: 'var(--dark-grey)' }}>Resolved Journal Universe:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{universeCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* UpSet Matrix Visualization Description */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
          <strong>UpSet Exact Aggregation Principle:</strong> Unlike area-proportional Venn diagrams which suffer from distortion
          when representing extreme differences (e.g. 10 journals in RW vs 12,181 in S), the UpSet matrix accurately plots
          every disjoint intersection partition with bar heights scaled to journal volume.
        </div>
      </div>

      {/* UpSet Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: 'var(--space-2)',
          alignItems: 'end',
          paddingTop: 'var(--space-4)',
          borderBottom: '2px solid var(--neutral-border)',
          paddingBottom: 'var(--space-3)',
          overflowX: 'auto',
        }}
      >
        {aggregates.map((agg) => {
          const barHeight = Math.max(16, Math.round((agg.count / maxCount) * 160));
          return (
            <div
              key={agg.region}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-1)',
                cursor: onSelectRegion ? 'pointer' : 'default',
              }}
              onClick={() => onSelectRegion?.(agg.region)}
              title={`Partition ${agg.region}: ${agg.count.toLocaleString()} unique journals`}
            >
              {/* Count label */}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: 'var(--warm-black)',
                }}
              >
                {agg.count >= 1000 ? `${(agg.count / 1000).toFixed(1)}k` : agg.count}
              </span>

              {/* Bar */}
              <div
                style={{
                  width: '32px',
                  height: `${barHeight}px`,
                  backgroundColor: agg.R && agg.W && agg.S
                    ? 'var(--warm-black)'
                    : agg.R && agg.S
                    ? 'var(--grapefruit)'
                    : agg.W && agg.S
                    ? 'var(--mid-green)'
                    : agg.R && agg.W
                    ? 'var(--salmon)'
                    : agg.R
                    ? 'var(--sanguine)'
                    : agg.W
                    ? 'var(--dark-green)'
                    : 'var(--mid-green)',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  transition: 'opacity 0.15s ease',
                }}
              />

              {/* Matrix Dots */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingTop: 'var(--space-2)',
                  alignItems: 'center',
                }}
              >
                {/* Dot for R */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: agg.R ? 'var(--sanguine)' : 'var(--neutral-border)',
                    opacity: agg.R ? 1 : 0.25,
                  }}
                  title={agg.R ? 'Member of Rejected' : 'Not in Rejected'}
                />
                {/* Dot for W */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: agg.W ? 'var(--dark-green)' : 'var(--neutral-border)',
                    opacity: agg.W ? 1 : 0.25,
                  }}
                  title={agg.W ? 'Member of Withdrawn' : 'Not in Withdrawn'}
                />
                {/* Dot for S */}
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: agg.S ? 'var(--mid-green)' : 'var(--neutral-border)',
                    opacity: agg.S ? 1 : 0.25,
                  }}
                  title={agg.S ? 'Member of SINTA' : 'Not in SINTA'}
                />
              </div>

              {/* Partition Tag */}
              <span
                className="badge badge-neutral"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  marginTop: 'var(--space-1)',
                }}
              >
                {agg.region}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
