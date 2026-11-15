/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

test('Regression & Schema Invariant: Rejection History & Lifecycle Outcomes', async (t) => {
  const summaryPath = path.join(rootDir, 'public/data/v1/summary_public.json');
  assert.ok(fs.existsSync(summaryPath), 'summary_public.json must exist');

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  assert.ok(summary.lifecycle_summary, 'summary must contain lifecycle_summary');
  assert.ok(summary.lifecycle_summary.rejection_frequency_outcomes, 'lifecycle_summary must contain rejection_frequency_outcomes');

  const outcomes = summary.lifecycle_summary.rejection_frequency_outcomes;
  const expectedFrequencies = ['1', '2', '3', '4', '5', '6+'];

  for (const freq of expectedFrequencies) {
    assert.ok(outcomes[freq], `outcomes must include frequency ${freq}`);
    const data = outcomes[freq];

    // Verify property names match frontend usage (specifically 'total' instead of obsolete 'total_journals')
    assert.equal(typeof data.total, 'number', `outcome[${freq}].total must be a number`);
    assert.ok(data.total > 0, `outcome[${freq}].total must be positive`);
    assert.equal(typeof data.currently_indexed, 'number', `outcome[${freq}].currently_indexed must be a number`);
    assert.equal(typeof data.accepted_overlap, 'number', `outcome[${freq}].accepted_overlap must be a number`);
    assert.equal(typeof data.withdrawn_overlap, 'number', `outcome[${freq}].withdrawn_overlap must be a number`);

    // Verify mathematical bounds
    assert.ok(data.currently_indexed <= data.total, `currently_indexed cannot exceed total for ${freq}`);
    assert.ok(data.accepted_overlap <= data.total, `accepted_overlap cannot exceed total for ${freq}`);
    assert.ok(data.withdrawn_overlap <= data.total, `withdrawn_overlap cannot exceed total for ${freq}`);
  }

  // Verify that RejectionHistoryPage.tsx accesses data.total and NOT data.total_journals
  const pageSource = fs.readFileSync(path.join(rootDir, 'src/pages/RejectionHistoryPage.tsx'), 'utf8');
  assert.match(pageSource, /data\.total\.toLocaleString\(\)/, 'RejectionHistoryPage must access data.total');
  assert.doesNotMatch(pageSource, /data\.total_journals/, 'RejectionHistoryPage must NOT access data.total_journals');

  // Verify that ErrorBoundary is defined and included in App.tsx
  const errorBoundaryPath = path.join(rootDir, 'src/components/common/ErrorBoundary.tsx');
  assert.ok(fs.existsSync(errorBoundaryPath), 'ErrorBoundary component must exist');
  const appSource = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
  assert.match(appSource, /<ErrorBoundary/, 'App.tsx must wrap application in ErrorBoundary');
});
