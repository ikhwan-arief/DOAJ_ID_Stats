import React, { useEffect, useRef, useState } from 'react';
import * as echarts from '../../lib/echarts';
import { exportEChartAsPng } from '../../lib/chartExport';

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
  snapshotDate?: string;
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
  snapshotDate = '15 November 2026',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

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

  const handleDownloadPng = async () => {
    if (!chartInstance.current) return;
    try {
      setIsExporting(true);
      await exportEChartAsPng(chartInstance.current, {
        title: title || ariaLabel || 'Chart',
        metricLabel,
        unit,
        denominatorNote,
        scopeNote,
        snapshotDate,
      });
    } catch (err) {
      console.error('Failed to export chart PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

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
        position: 'relative',
      }}
    >
      {/* Header and Analytical Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {scopeNote && (
            <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
              {scopeNote}
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadPng}
            disabled={isExporting}
            style={{
              padding: '4px 10px',
              minHeight: '28px',
              fontSize: 'var(--text-xs)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 600,
            }}
            title={`Download ${title || 'Chart'} as PNG`}
            aria-label={`Download ${title || 'Chart'} as PNG`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>{isExporting ? 'Exporting…' : 'Download PNG'}</span>
          </button>
        </div>
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

