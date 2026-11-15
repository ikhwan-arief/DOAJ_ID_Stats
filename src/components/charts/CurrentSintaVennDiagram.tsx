import React, { useRef, useState } from 'react';
import { exportSvgAsPng } from '../../lib/chartExport';

interface CurrentSintaVennDiagramProps {
  doajOnlyCount: number;
  sintaOnlyCount: number;
  bothCount: number;
  totalUniverse: number;
}

export const CurrentSintaVennDiagram: React.FC<CurrentSintaVennDiagramProps> = ({
  doajOnlyCount,
  sintaOnlyCount,
  bothCount,
  totalUniverse,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const doajTotal = doajOnlyCount + bothCount;
  const sintaTotal = sintaOnlyCount + bothCount;

  const handleDownloadPng = async () => {
    if (!svgRef.current) return;
    try {
      setIsExporting(true);
      await exportSvgAsPng(svgRef.current, {
        title: 'Current DOAJ × SINTA Indexing Overlap',
        metricLabel: 'Resolved Unique Journals',
        unit: 'journals',
        denominatorNote: `Universe of ${totalUniverse.toLocaleString()} journals`,
        scopeNote: 'DOAJ (Nov 15, 2026) vs SINTA Census Snapshot',
        snapshotDate: '15 November 2026',
      });
    } catch (err) {
      console.error('Failed to export Current SINTA Venn PNG:', err);
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
        gap: 'var(--space-3)',
        padding: 'var(--space-4)',
        background: 'var(--white)',
        border: '1px solid var(--neutral-border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-md)', margin: 0 }}>
            Current DOAJ × SINTA Indexing Overlap (Two-Set Venn)
          </h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginTop: '2px' }}>
            Metric: Resolved Unique Journals • Universe: {totalUniverse.toLocaleString()} • DOAJ (Nov 15, 2026) vs SINTA Snapshot
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="badge badge-neutral">Current Status Model</span>
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
            title="Download Two-Set Venn as PNG"
            aria-label="Download Two-Set Venn as PNG"
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

      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '260px' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 520 280"
          style={{ width: '100%', maxWidth: '500px', height: 'auto', overflow: 'visible' }}
          role="img"
          aria-label="Two-set Venn diagram showing overlap between currently indexed DOAJ Indonesian journals and SINTA accredited journals"
        >
          {/* Left Circle: Current DOAJ */}
          <circle
            cx="200"
            cy="140"
            r="105"
            fill="var(--dark-navy)"
            fillOpacity="0.18"
            stroke="var(--dark-navy)"
            strokeWidth="2.5"
          />

          {/* Right Circle: SINTA */}
          <circle
            cx="320"
            cy="140"
            r="105"
            fill="var(--warm-black)"
            fillOpacity="0.12"
            stroke="var(--warm-black)"
            strokeWidth="2.5"
          />

          {/* Label: DOAJ Only (Left) */}
          <text
            x="145"
            y="135"
            textAnchor="middle"
            fill="var(--dark-navy)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800 }}
          >
            {doajOnlyCount.toLocaleString()}
          </text>
          <text
            x="145"
            y="155"
            textAnchor="middle"
            fill="var(--dark-navy)"
            style={{ fontSize: '11px', fontWeight: 600 }}
          >
            DOAJ Only (D)
          </text>

          {/* Label: Intersection (Both) */}
          <text
            x="260"
            y="135"
            textAnchor="middle"
            fill="var(--sanguine)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 900 }}
          >
            {bothCount.toLocaleString()}
          </text>
          <text
            x="260"
            y="155"
            textAnchor="middle"
            fill="var(--sanguine)"
            style={{ fontSize: '11px', fontWeight: 700 }}
          >
            Both (DS)
          </text>

          {/* Label: SINTA Only (Right) */}
          <text
            x="375"
            y="135"
            textAnchor="middle"
            fill="var(--warm-black)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800 }}
          >
            {sintaOnlyCount.toLocaleString()}
          </text>
          <text
            x="375"
            y="155"
            textAnchor="middle"
            fill="var(--warm-black)"
            style={{ fontSize: '11px', fontWeight: 600 }}
          >
            SINTA Only (S)
          </text>

          {/* Outer Header Legend */}
          <text
            x="150"
            y="25"
            textAnchor="middle"
            fill="var(--dark-navy)"
            style={{ fontSize: '12px', fontWeight: 700 }}
          >
            Current DOAJ ({doajTotal.toLocaleString()})
          </text>
          <text
            x="370"
            y="25"
            textAnchor="middle"
            fill="var(--warm-black)"
            style={{ fontSize: '12px', fontWeight: 700 }}
          >
            SINTA Accredited ({sintaTotal.toLocaleString()})
          </text>
        </svg>
      </div>

      {/* Summary Legend Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 'var(--space-2)',
          paddingTop: 'var(--space-2)',
          borderTop: '1px solid var(--light-grey)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>DOAJ Indexed Total</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--dark-navy)' }}>
            {doajTotal.toLocaleString()}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>Both DOAJ & SINTA</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--sanguine)' }}>
            {bothCount.toLocaleString()} ({(bothCount / doajTotal * 100).toFixed(1)}%)
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>DOAJ Unmatched to SINTA</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--dark-navy)' }}>
            {doajOnlyCount.toLocaleString()} ({(doajOnlyCount / doajTotal * 100).toFixed(1)}%)
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)' }}>SINTA Not in DOAJ</div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--warm-black)' }}>
            {sintaOnlyCount.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
