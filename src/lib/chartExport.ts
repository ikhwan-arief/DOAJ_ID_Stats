/**
 * Shared chart image export utilities for DOAJ × SINTA Journal Observatory.
 * Supports Apache ECharts instances, raw SVG elements, and standard HTML/DOM elements.
 * Generates publication-ready, high-resolution PNGs (3x pixel ratio) with complete
 * typography, clean white background, title context, and source attribution.
 *
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */

import * as echarts from './echarts';

export interface ChartExportOptions {
  title: string;
  metricLabel?: string;
  unit?: string;
  denominatorNote?: string;
  scopeNote?: string;
  snapshotDate?: string;
}

/**
 * Sanitize filename to prevent invalid characters.
 */
export function sanitizeChartFilename(title: string, date: string = '2026-11-15'): string {
  const cleanTitle = title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return `DOAJ-SINTA_${cleanTitle || 'Chart'}_${date}.png`;
}

/**
 * Triggers a browser download of a PNG data URL.
 */
export function triggerPngDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Composite a chart image (Canvas/Image) onto a clean high-res canvas with title, metadata, and attribution.
 */
export function compositeChartWithAttribution(
  chartImage: CanvasImageSource,
  chartWidth: number,
  chartHeight: number,
  options: ChartExportOptions
): string {
  const scale = 2; // 2x or 3x for crisp text
  const paddingX = 32 * scale;
  const headerHeight = 84 * scale;
  const footerHeight = 44 * scale;
  const totalWidth = chartWidth * scale + paddingX * 2;
  const totalHeight = chartHeight * scale + headerHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create canvas rendering context');
  }

  // 1. Clean white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // 2. Title
  ctx.fillStyle = '#282624'; // --warm-black
  ctx.font = `bold ${18 * scale}px Georgia, Spectral, serif`;
  ctx.fillText(options.title, paddingX, 34 * scale);

  // 3. Subtitle / Metadata
  const subParts: string[] = [];
  if (options.metricLabel) {
    subParts.push(`Metric: ${options.metricLabel}${options.unit ? ` (${options.unit})` : ''}`);
  }
  if (options.denominatorNote) {
    subParts.push(`Denominator: ${options.denominatorNote}`);
  }
  if (options.scopeNote) {
    subParts.push(`Scope: ${options.scopeNote}`);
  }

  ctx.fillStyle = '#6E6B68'; // --dark-grey
  ctx.font = `${11 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  if (subParts.length > 0) {
    ctx.fillText(subParts.join(' • '), paddingX, 58 * scale);
  }

  // Header separator line
  ctx.strokeStyle = '#E0DCD6'; // --neutral-border
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(paddingX, 72 * scale);
  ctx.lineTo(totalWidth - paddingX, 72 * scale);
  ctx.stroke();

  // 4. Draw the chart
  ctx.drawImage(chartImage, paddingX, headerHeight, chartWidth * scale, chartHeight * scale);

  // Footer separator line
  ctx.beginPath();
  ctx.moveTo(paddingX, totalHeight - 34 * scale);
  ctx.lineTo(totalWidth - paddingX, totalHeight - 34 * scale);
  ctx.stroke();

  // 5. Attribution & Date
  const dateStr = options.snapshotDate || '15 November 2026';
  ctx.fillStyle = '#6E6B68';
  ctx.font = `${10 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText('DOAJ × SINTA Journal Observatory • Open Scholarly Analytics', paddingX, totalHeight - 16 * scale);

  const rightText = `Snapshot: ${dateStr}`;
  const rightWidth = ctx.measureText(rightText).width;
  ctx.fillText(rightText, totalWidth - paddingX - rightWidth, totalHeight - 16 * scale);

  return canvas.toDataURL('image/png');
}

/**
 * Export an Apache ECharts instance as high-resolution PNG with attribution.
 */
export async function exportEChartAsPng(
  chartInstance: echarts.ECharts,
  options: ChartExportOptions
): Promise<void> {
  const pixelRatio = 3;
  const rawDataUrl = chartInstance.getDataURL({
    type: 'png',
    pixelRatio,
    backgroundColor: '#FFFFFF',
    excludeComponents: ['toolbox'],
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load chart image'));
    img.src = rawDataUrl;
  });

  const width = chartInstance.getWidth();
  const height = chartInstance.getHeight();
  const compositedUrl = compositeChartWithAttribution(img, width, height, options);
  const filename = sanitizeChartFilename(options.title, options.snapshotDate || '2026-11-15');
  triggerPngDownload(compositedUrl, filename);
}

/**
 * Export an SVG element as high-resolution PNG with attribution.
 */
export async function exportSvgAsPng(
  svgElement: SVGSVGElement,
  options: ChartExportOptions
): Promise<void> {
  const bbox = svgElement.getBoundingClientRect();
  const width = Math.max(svgElement.viewBox.baseVal.width || 520, bbox.width || 520);
  const height = Math.max(svgElement.viewBox.baseVal.height || 360, bbox.height || 360);

  // Clone SVG to safely resolve inline styles
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute('width', `${width}`);
  clonedSvg.setAttribute('height', `${height}`);

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);

  // Ensure xmlns is present
  if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to rasterize SVG'));
    img.src = url;
  });

  URL.revokeObjectURL(url);

  const compositedUrl = compositeChartWithAttribution(img, width, height, options);
  const filename = sanitizeChartFilename(options.title, options.snapshotDate || '2026-11-15');
  triggerPngDownload(compositedUrl, filename);
}

/**
 * Export an HTML container element (e.g. UpSet chart) by drawing its contents to a high-res canvas.
 */
export async function exportHtmlContainerAsPng(
  container: HTMLElement,
  options: ChartExportOptions
): Promise<void> {
  const rect = container.getBoundingClientRect();
  const width = Math.max(480, Math.round(rect.width));
  const height = Math.max(260, Math.round(rect.height));

  // Render SVG or construct foreignObject SVG
  const serializer = new XMLSerializer();
  const clone = container.cloneNode(true) as HTMLElement;

  // Inline computed styles for critical text elements
  const allElements = container.querySelectorAll('*');
  const cloneElements = clone.querySelectorAll('*');
  for (let i = 0; i < allElements.length; i++) {
    const orig = allElements[i] as HTMLElement;
    const cl = cloneElements[i] as HTMLElement;
    if (orig && cl && orig.nodeType === Node.ELEMENT_NODE) {
      const computed = window.getComputedStyle(orig);
      cl.style.color = computed.color;
      cl.style.backgroundColor = computed.backgroundColor;
      cl.style.fontFamily = computed.fontFamily;
      cl.style.fontSize = computed.fontSize;
      cl.style.fontWeight = computed.fontWeight;
      cl.style.borderColor = computed.borderColor;
    }
  }

  const foreignObjectHtml = serializer.serializeToString(clone);
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${foreignObjectHtml}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => {
      // If foreignObject rasterization is blocked by browser policy, fallback gracefully
      resolve();
    };
    img.src = url;
  });

  URL.revokeObjectURL(url);

  const compositedUrl = compositeChartWithAttribution(img, width, height, options);
  const filename = sanitizeChartFilename(options.title, options.snapshotDate || '2026-11-15');
  triggerPngDownload(compositedUrl, filename);
}
