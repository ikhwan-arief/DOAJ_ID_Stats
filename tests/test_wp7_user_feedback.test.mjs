/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('WP7 feedback: rejected-page privacy notice is removed and matching labels are plain language', () => {
  const rejected = read('src/pages/RejectedApplicationsPage.tsx');
  const filters = read('src/components/common/GlobalFilterBar.tsx');

  assert.doesNotMatch(rejected, /DOAJ Privacy Link Rule/);
  assert.doesNotMatch(filters, /e-to-e|p-to-p/);
  assert.match(filters, /Journal Matching Method/);
  assert.match(filters, /Standard — same ISSN type/);
  assert.match(filters, /Expanded — also cross-check print\/online/);
});

test('WP7 feedback: every tabular data page uses sortable headers', () => {
  const tablePages = [
    'src/pages/OverviewPage.tsx',
    'src/pages/RejectedApplicationsPage.tsx',
    'src/pages/RejectionHistoryPage.tsx',
    'src/pages/WithdrawnJournalsPage.tsx',
    'src/pages/SintaAnalysisPage.tsx',
    'src/pages/DataQualityPage.tsx',
  ];

  for (const page of tablePages) {
    const source = read(page);
    assert.match(source, /<SortableHeader/, `${page} must expose sortable data headers`);
    assert.match(source, /useSortableData/, `${page} must sort its displayed rows`);
  }
});

test('WP7 feedback: dated record tables default to newest first', () => {
  const defaults = [
    ['src/pages/RejectedApplicationsPage.tsx', /'date', 'desc'/],
    ['src/pages/RejectionHistoryPage.tsx', /'dates', 'desc'/],
    ['src/pages/WithdrawnJournalsPage.tsx', /'withdrawn', 'desc'/],
    ['src/pages/DataQualityPage.tsx', /'date', 'desc'/],
  ];

  for (const [page, pattern] of defaults) {
    assert.match(read(page), pattern, `${page} must default to descending date order`);
  }
});

test('WP7 feedback: overview recomputes metrics and intersections from active filters', () => {
  const overview = read('src/pages/OverviewPage.tsx');

  assert.match(overview, /loadFactRejected/);
  assert.match(overview, /loadFactWithdrawn/);
  assert.match(overview, /loadDimJournals/);
  assert.match(overview, /filters\.eventKind/);
  assert.match(overview, /filters\.yearRange/);
  assert.match(overview, /filters\.sintaRank/);
  assert.match(overview, /filters\.matchingMode/);
  assert.match(overview, /filteredView\.intersections/);
});
