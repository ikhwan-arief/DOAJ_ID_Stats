import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Chart Download PNG Button Invariants', async (t) => {
  await t.test('BaseEChart provides visible Download PNG button and accessible aria-label', () => {
    const code = fs.readFileSync(path.resolve('src/components/charts/BaseEChart.tsx'), 'utf8');
    assert.ok(code.includes('Download PNG'), 'BaseEChart must contain Download PNG label');
    assert.ok(code.includes('exportEChartAsPng'), 'BaseEChart must invoke exportEChartAsPng utility');
    assert.ok(code.includes('aria-label='), 'BaseEChart must supply accessible aria-label');
  });

  await t.test('DeterministicVennDiagram provides visible Download PNG button and exportSvgAsPng', () => {
    const code = fs.readFileSync(path.resolve('src/components/charts/DeterministicVennDiagram.tsx'), 'utf8');
    assert.ok(code.includes('Download PNG'), 'DeterministicVennDiagram must contain Download PNG button');
    assert.ok(code.includes('exportSvgAsPng'), 'DeterministicVennDiagram must use exportSvgAsPng');
    assert.ok(code.includes('handleDownloadPng'), 'DeterministicVennDiagram must handle PNG download');
  });

  await t.test('CurrentSintaVennDiagram provides visible Download PNG button and exportSvgAsPng', () => {
    const code = fs.readFileSync(path.resolve('src/components/charts/CurrentSintaVennDiagram.tsx'), 'utf8');
    assert.ok(code.includes('Download PNG'), 'CurrentSintaVennDiagram must contain Download PNG button');
    assert.ok(code.includes('exportSvgAsPng'), 'CurrentSintaVennDiagram must use exportSvgAsPng');
  });

  await t.test('UpsetVennChart provides visible Download PNG button and exportHtmlContainerAsPng', () => {
    const code = fs.readFileSync(path.resolve('src/components/charts/UpsetVennChart.tsx'), 'utf8');
    assert.ok(code.includes('Download PNG'), 'UpsetVennChart must contain Download PNG button');
    assert.ok(code.includes('exportHtmlContainerAsPng'), 'UpsetVennChart must use exportHtmlContainerAsPng');
  });

  await t.test('chartExport utility formats filename and produces PNG MIME data URLs', () => {
    const code = fs.readFileSync(path.resolve('src/lib/chartExport.ts'), 'utf8');
    assert.ok(code.includes('sanitizeChartFilename'), 'chartExport must sanitize chart filename');
    assert.ok(code.includes('image/png'), 'chartExport must export image/png data URL');
    assert.ok(code.includes('compositeChartWithAttribution'), 'chartExport must composite title, context, and attribution');
  });
});
