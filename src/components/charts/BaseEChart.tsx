import React, { useEffect, useRef } from 'react';
import * as echarts from '../../lib/echarts';

export interface BaseChartProps {
  title?: string;
  metricLabel: string;
  unit: string;
  denominatorNote?: string;
  scopeNote?: string;
  options: echarts.EChartsOption;
  height?: number | string;
  ariaLabel: string;
  onChartClick?: (params: any) => void;
}

export const BaseEChart: React.FC<BaseChartProps> = ({
  title,
  metricLabel,
  unit,
  denominatorNote,
  scopeNote,
  options,
  height = 320,
  ariaLabel,
  onChartClick,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, undefined, {
        renderer: 'svg',
      });

      if (onChartClick) {
        chartInstance.current.on('click', onChartClick);
      }
    }

    chartInstance.current.setOption(options, true);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [options, onChartClick]);

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        padding: 'var(--space-4)',
        background: 'var(--white)',
        border: '1px solid var(--neutral-border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Header and Analytical Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div>
          {title && (
            <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-md)', margin: 0, color: 'var(--warm-black)' }}>
              {title}
            </h4>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--sanguine)' }}>
              Metric: {metricLabel} ({unit})
            </span>
            {denominatorNote && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>
                • Denominator: {denominatorNote}
              </span>
            )}
          </div>
        </div>
        {scopeNote && (
          <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
            {scopeNote}
          </span>
        )}
      </div>

      {/* Chart Canvas */}
      <div
        ref={chartRef}
        role="img"
        aria-label={ariaLabel}
        style={{ width: '100%', height: typeof height === 'number' ? `${height}px` : height, minHeight: '260px' }}
      />
    </div>
  );
};
