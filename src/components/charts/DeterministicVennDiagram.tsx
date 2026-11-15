import React from 'react';

interface VennRegionData {
  region: string;
  R: boolean;
  W: boolean;
  S: boolean;
  count: number;
}

interface DeterministicVennDiagramProps {
  regions: VennRegionData[];
  onSelectRegion?: (region: string) => void;
  selectedRegion?: string | null;
}

export const DeterministicVennDiagram: React.FC<DeterministicVennDiagramProps> = ({
  regions,
  onSelectRegion,
  selectedRegion,
}) => {
  const getCount = (rCode: string) => {
    return regions.find((r) => r.region === rCode)?.count || 0;
  };

  const rCount = getCount('R');
  const wCount = getCount('W');
  const sCount = getCount('S');
  const rwCount = getCount('RW');
  const rsCount = getCount('RS');
  const wsCount = getCount('WS');
  const rwsCount = getCount('RWS');

  const totalRejected = rCount + rwCount + rsCount + rwsCount;
  const totalWithdrawn = wCount + rwCount + wsCount + rwsCount;
  const totalSinta = sCount + rsCount + wsCount + rwsCount;

  const totalUniverse = regions.reduce((sum, r) => sum + r.count, 0);

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
        <div>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-md)', margin: 0 }}>
            Three-Set Euler / Venn Partition Topology
          </h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', marginTop: '2px' }}>
            Metric: Resolved Unique Journals • Universe: {totalUniverse.toLocaleString()} • Click any region to filter or inspect
          </p>
        </div>
        <span className="badge badge-neutral">Deterministic Set Geometry</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-2) 0' }}>
        <svg
          viewBox="0 0 520 380"
          style={{ width: '100%', maxWidth: '520px', height: 'auto', maxHeight: '340px' }}
          role="img"
          aria-label="Three-set Venn diagram representing DOAJ Rejected, DOAJ Withdrawn, and SINTA journals"
        >
          <defs>
            <radialGradient id="gradR" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#982E0A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#982E0A" stopOpacity="0.45" />
            </radialGradient>
            <radialGradient id="gradW" cx="65%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#3A5959" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3A5959" stopOpacity="0.45" />
            </radialGradient>
            <radialGradient id="gradS" cx="50%" cy="75%" r="65%">
              <stop offset="0%" stopColor="#47A178" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#47A178" stopOpacity="0.45" />
            </radialGradient>
          </defs>

          {/* Circle R: Rejected */}
          <circle
            cx="190"
            cy="160"
            r="120"
            fill="url(#gradR)"
            stroke="var(--sanguine)"
            strokeWidth={selectedRegion?.includes('R') ? '3' : '1.5'}
          />

          {/* Circle W: Withdrawn */}
          <circle
            cx="330"
            cy="160"
            r="120"
            fill="url(#gradW)"
            stroke="var(--dark-green)"
            strokeWidth={selectedRegion?.includes('W') ? '3' : '1.5'}
          />

          {/* Circle S: SINTA */}
          <circle
            cx="260"
            cy="240"
            r="120"
            fill="url(#gradS)"
            stroke="var(--mid-green)"
            strokeWidth={selectedRegion?.includes('S') ? '3' : '1.5'}
          />

          {/* Set Labels Outside */}
          <text x="110" y="70" fill="var(--sanguine)" fontSize="14" fontWeight="700" fontFamily="var(--font-sans)">
            DOAJ Rejected ({totalRejected.toLocaleString()})
          </text>
          <text x="310" y="70" fill="var(--dark-green)" fontSize="14" fontWeight="700" fontFamily="var(--font-sans)">
            DOAJ Withdrawn ({totalWithdrawn.toLocaleString()})
          </text>
          <text x="260" y="375" fill="var(--mid-green)" fontSize="14" fontWeight="700" textAnchor="middle" fontFamily="var(--font-sans)">
            SINTA Population ({totalSinta.toLocaleString()})
          </text>

          {/* Region R (Only Rejected) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectRegion?.('R')}
            aria-label={`Region R: ${rCount.toLocaleString()} journals`}
          >
            <text x="140" y="150" fill="var(--warm-black)" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
              {rCount.toLocaleString()}
            </text>
            <text x="140" y="165" fill="var(--dark-grey)" fontSize="11" textAnchor="middle" fontFamily="var(--font-sans)">
              R Only
            </text>
          </g>

          {/* Region W (Only Withdrawn) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectRegion?.('W')}
            aria-label={`Region W: ${wCount.toLocaleString()} journals`}
          >
            <text x="380" y="150" fill="var(--warm-black)" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
              {wCount.toLocaleString()}
            </text>
            <text x="380" y="165" fill="var(--dark-grey)" fontSize="11" textAnchor="middle" fontFamily="var(--font-sans)">
              W Only
            </text>
          </g>

          {/* Region S (Only SINTA) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectRegion?.('S')}
            aria-label={`Region S: ${sCount.toLocaleString()} journals`}
          >
            <text x="260" y="315" fill="var(--warm-black)" fontSize="14" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
              {sCount.toLocaleString()}
            </text>
            <text x="260" y="330" fill="var(--dark-grey)" fontSize="11" textAnchor="middle" fontFamily="var(--font-sans)">
              S Only
            </text>
          </g>

          {/* Region RW (Rejected ∩ Withdrawn, outside S) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectRegion?.('RW')}
            aria-label={`Region RW: ${rwCount.toLocaleString()} journals`}
          >
            <text x="260" y="115" fill="var(--warm-black)" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
              {rwCount.toLocaleString()}
            </text>
            <text x="260" y="130" fill="var(--dark-grey)" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
              RW
            </text>
          </g>

          {/* Region RS (Rejected ∩ SINTA, outside W) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectRegion?.('RS')}
            aria-label={`Region RS: ${rsCount.toLocaleString()} journals`}
          >
            <text x="195" y="235" fill="var(--warm-black)" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
              {rsCount.toLocaleString()}
            </text>
            <text x="195" y="250" fill="var(--dark-grey)" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
              RS
            </text>
          </g>

          {/* Region WS (Withdrawn ∩ SINTA, outside R) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectRegion?.('WS')}
            aria-label={`Region WS: ${wsCount.toLocaleString()} journals`}
          >
            <text x="325" y="235" fill="var(--warm-black)" fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="var(--font-mono)">
              {wsCount.toLocaleString()}
            </text>
            <text x="325" y="250" fill="var(--dark-grey)" fontSize="10" textAnchor="middle" fontFamily="var(--font-sans)">
              WS
            </text>
          </g>

          {/* Region RWS (Triple Overlap) */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectRegion?.('RWS')}
            aria-label={`Region RWS: ${rwsCount.toLocaleString()} journals`}
          >
            <circle cx="260" cy="190" r="22" fill="#FFFFFF" fillOpacity="0.85" stroke="var(--warm-black)" strokeWidth="1" />
            <text x="260" y="190" fill="var(--warm-black)" fontSize="12" fontWeight="700" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)">
              {rwsCount}
            </text>
            <text x="260" y="204" fill="var(--dark-grey)" fontSize="9" textAnchor="middle" fontFamily="var(--font-sans)">
              RWS
            </text>
          </g>
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--dark-grey)', borderTop: '1px solid var(--light-grey)', paddingTop: 'var(--space-2)' }}>
        <span>Topology reflects mutually disjoint partitions from Codex WP3 reconciliation.</span>
        <span>Sum of Partitions: <strong>{totalUniverse.toLocaleString()}</strong></span>
      </div>
    </div>
  );
};
