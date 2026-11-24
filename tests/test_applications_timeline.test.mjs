/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('applications timeline: monthly window Jan 2022 – Nov 2026 covers every record', () => {
  const records = JSON.parse(read('public/data/v1/fact_applications_public.json'));
  const inWindow = (day) => day && day.slice(0, 7) >= '2022-01' && day.slice(0, 7) <= '2026-11';
  assert.equal(records.filter((r) => inWindow(r.submitted_day)).length, 11292);
  assert.equal(records.filter((r) => inWindow(r.rejected_day)).length, 9343);
});

test('applications timeline: chart is rendered on SINTA Analysis with zoom support', () => {
  assert.match(read('src/pages/SintaAnalysisPage.tsx'), /<ApplicationsTimelineChart/);
  assert.match(read('src/components/charts/ApplicationsCohortSection.tsx'), /export function buildApplicationTimeline/);
  assert.match(read('src/lib/echarts.ts'), /DataZoomComponent/);
});
