/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 *
 * Global chart axis label configuration and readability utilities.
 * Ensures complete, non-truncated, non-skipped category labels across all visualizations.
 */

export const CANONICAL_SINTA_RANKS = [
  'S1',
  'S2',
  'S3',
  'S4',
  'S5',
  'S6',
  'NA',
  'unmatched',
  'ambiguous',
] as const;

export type CanonicalSintaRank = typeof CANONICAL_SINTA_RANKS[number];

/**
 * Maps SINTA rank codes to standardized, readable display labels.
 */
export function formatSintaRankLabel(rank: string): string {
  switch (rank) {
    case 'S1':
      return 'S1';
    case 'S2':
      return 'S2';
    case 'S3':
      return 'S3';
    case 'S4':
      return 'S4';
    case 'S5':
      return 'S5';
    case 'S6':
      return 'S6';
    case 'NA':
      return 'NA';
    case 'unmatched':
    case 'Unmatched':
      return 'Unmatched';
    case 'ambiguous':
    case 'Ambiguous':
      return 'Ambiguous';
    default:
      return rank;
  }
}

/**
 * Returns detailed tooltip description for each SINTA rank.
 */
export function getSintaRankTooltipDescription(rank: string): string {
  switch (rank) {
    case 'S1':
      return 'SINTA 1 (Top National Tier / Highest Impact)';
    case 'S2':
      return 'SINTA 2 (High National Accreditation)';
    case 'S3':
      return 'SINTA 3 (Medium National Accreditation)';
    case 'S4':
      return 'S4 (SINTA 4 Accredited)';
    case 'S5':
      return 'S5 (SINTA 5 Accredited)';
    case 'S6':
      return 'S6 (SINTA 6 Accredited)';
    case 'NA':
      return 'NA (No SINTA rank recorded in national census)';
    case 'unmatched':
    case 'Unmatched':
      return 'Unmatched (No confirmed match to SINTA database)';
    case 'ambiguous':
    case 'Ambiguous':
      return 'Ambiguous (SINTA identity requires review / multiple candidates)';
    default:
      return rank;
  }
}

/**
 * Returns standard hex color for SINTA rank visualizations.
 */
export function getSintaRankColor(rank: string): string {
  switch (rank) {
    case 'S1':
      return '#1B4D3E'; // Deep Pine
    case 'S2':
      return '#2E6F56'; // Medium Forest
    case 'S3':
      return '#47A178'; // DOAJ Mid Green
    case 'S4':
      return '#3A5959'; // DOAJ Dark Green
    case 'S5':
      return '#8C6D31'; // Muted Amber
    case 'S6':
      return '#735338'; // Raw Umber
    case 'NA':
      return '#5C5956'; // Neutral Grey
    case 'unmatched':
    case 'Unmatched':
      return '#7E7A75'; // Slate Grey
    case 'ambiguous':
    case 'Ambiguous':
      return '#FD5A3B'; // Sanguine / Coral Alert
    default:
      return '#7E7A75';
  }
}

/**
 * Explicit ECharts categorical axis configuration that guarantees every category label is displayed.
 * Disables automatic label skipping (interval: 0), prevents hiding overlaps, and sets legible font.
 */
export type EChartsFontWeight = 'normal' | 'bold' | 'bolder' | 'lighter' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface CategoricalAxisOptions {
  rotate?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: EChartsFontWeight;
  margin?: number;
  formatter?: (value: string, index: number) => string;
}

export function createCategoricalAxisLabelConfig(options: CategoricalAxisOptions = {}) {
  const {
    rotate = 0,
    fontSize = 11,
    fontFamily = 'var(--font-mono)',
    fontWeight = 600,
    margin = 8,
    formatter,
  } = options;

  return {
    interval: 0,
    hideOverlap: false,
    rotate,
    fontSize,
    fontFamily,
    fontWeight,
    margin,
    ...(formatter ? { formatter } : {}),
  };
}

/**
 * Standard grid configuration to give categorical charts sufficient padding so labels are never clipped.
 */
export function createCategoricalGridConfig(options: {
  left?: string | number;
  right?: string | number;
  top?: string | number;
  bottom?: string | number;
  containLabel?: boolean;
} = {}) {
  return {
    left: options.left ?? '4%',
    right: options.right ?? '4%',
    top: options.top ?? '10%',
    bottom: options.bottom ?? '16%',
    containLabel: options.containLabel ?? true,
  };
}
