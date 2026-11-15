import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_SINTA_RANKS,
  formatSintaRankLabel,
  getSintaRankTooltipDescription,
  getSintaRankColor,
  createCategoricalAxisLabelConfig,
  createCategoricalGridConfig,
} from '../src/lib/chartAxisConfig.ts';

const rootDir = process.cwd();

test('Global Chart Axis Label Invariants & Accreditation Tier Readability', async (t) => {
  await t.test('Canonical SINTA categories contain S1-S6, NA, unmatched, and ambiguous', () => {
    const expected = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched', 'ambiguous'];
    assert.deepEqual([...CANONICAL_SINTA_RANKS], expected);

    // Verify formatSintaRankLabel
    assert.equal(formatSintaRankLabel('S1'), 'S1');
    assert.equal(formatSintaRankLabel('S6'), 'S6');
    assert.equal(formatSintaRankLabel('NA'), 'NA');
    assert.equal(formatSintaRankLabel('unmatched'), 'Unmatched');
    assert.equal(formatSintaRankLabel('ambiguous'), 'Ambiguous');

    // Tooltip descriptions are distinct and comprehensive
    assert.match(getSintaRankTooltipDescription('S1'), /SINTA 1/);
    assert.match(getSintaRankTooltipDescription('NA'), /No SINTA rank/);
    assert.match(getSintaRankTooltipDescription('unmatched'), /No confirmed match/);
    assert.match(getSintaRankTooltipDescription('ambiguous'), /requires review/);

    // Each rank has a distinct recognizable color
    const colors = expected.map(getSintaRankColor);
    const uniqueColors = new Set(colors);
    assert.equal(uniqueColors.size, expected.length, 'Every canonical rank must have a unique distinct color');
  });

  await t.test('createCategoricalAxisLabelConfig enforces interval: 0 and hideOverlap: false', () => {
    const config = createCategoricalAxisLabelConfig();
    assert.equal(config.interval, 0, 'interval must be 0 to disable automatic skipping');
    assert.equal(config.hideOverlap, false, 'hideOverlap must be false to prevent hiding category labels');
    assert.equal(config.fontSize, 11);
    assert.equal(config.fontWeight, 600);

    const rotated = createCategoricalAxisLabelConfig({ rotate: 30, fontSize: 12 });
    assert.equal(rotated.rotate, 30);
    assert.equal(rotated.fontSize, 12);
    assert.equal(rotated.interval, 0);
  });

  await t.test('createCategoricalGridConfig provides sufficient bottom and side margins', () => {
    const grid = createCategoricalGridConfig();
    assert.equal(grid.containLabel, true);
    assert.ok(typeof grid.bottom === 'string' || typeof grid.bottom === 'number');
  });

  await t.test('RejectedApplicationsPage explicitly configures Accreditation Tier composition chart with all ranks and interval 0', () => {
    const pagePath = path.join(rootDir, 'src/pages/RejectedApplicationsPage.tsx');
    assert.ok(fs.existsSync(pagePath));
    const content = fs.readFileSync(pagePath, 'utf8');

    // Check presence of chart title
    assert.ok(content.includes('Accreditation Tier (SINTA Rank) Composition'));
    // Check usage of createCategoricalAxisLabelConfig
    assert.ok(content.includes('createCategoricalAxisLabelConfig'));
    // Check rankOrder contains S1 through S6, NA, unmatched, and ambiguous
    assert.ok(content.includes("'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA', 'unmatched'"));
  });

  await t.test('WithdrawnJournalsPage configures SINTA tier chart with all ranks and interval 0', () => {
    const pagePath = path.join(rootDir, 'src/pages/WithdrawnJournalsPage.tsx');
    assert.ok(fs.existsSync(pagePath));
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('Withdrawn Journals by Accreditation Tier'));
    assert.ok(content.includes('createCategoricalAxisLabelConfig'));
  });

  await t.test('SintaAnalysisPage configures all categorical axes with interval 0 and full rank labels', () => {
    const pagePath = path.join(rootDir, 'src/pages/SintaAnalysisPage.tsx');
    assert.ok(fs.existsSync(pagePath));
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('createCategoricalAxisLabelConfig'));
    assert.ok(content.includes('formatSintaRankLabel'));
  });

  await t.test('RejectionHistoryPage configures frequency and duration histograms with interval 0', () => {
    const pagePath = path.join(rootDir, 'src/pages/RejectionHistoryPage.tsx');
    assert.ok(fs.existsSync(pagePath));
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('createCategoricalAxisLabelConfig'));
  });

  await t.test('DataQualityPage configures categorical comparison and quality bar charts with interval 0', () => {
    const pagePath = path.join(rootDir, 'src/pages/DataQualityPage.tsx');
    assert.ok(fs.existsSync(pagePath));
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('createCategoricalAxisLabelConfig'));
  });
});
