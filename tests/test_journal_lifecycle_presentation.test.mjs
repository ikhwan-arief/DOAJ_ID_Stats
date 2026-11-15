import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatCurrentDoajStatusBadge, getCurrentDoajStatusSortRank } from '../src/lib/matchingLabels.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Journal Lifecycle Presentation & Invariants', async (t) => {
  await t.test('formatCurrentDoajStatusBadge maps positive indexing, ambiguity, and not found cleanly', () => {
    const indexed = formatCurrentDoajStatusBadge('currently_indexed');
    assert.equal(indexed.label, 'Currently Indexed');
    assert.equal(indexed.badgeClass, 'badge-sinta');

    const ambiguous = formatCurrentDoajStatusBadge('requires_review');
    assert.equal(ambiguous.label, 'Identity Requires Review');

    const notFound = formatCurrentDoajStatusBadge('not_found');
    assert.equal(notFound.label, '—');

    const empty = formatCurrentDoajStatusBadge(null);
    assert.equal(empty.label, '—');
  });

  await t.test('getCurrentDoajStatusSortRank provides consistent 1 (indexed), 2 (review), 3 (not found) ranking', () => {
    assert.equal(getCurrentDoajStatusSortRank('currently_indexed'), 1);
    assert.equal(getCurrentDoajStatusSortRank('requires_review'), 2);
    assert.equal(getCurrentDoajStatusSortRank('not_found'), 3);
    assert.equal(getCurrentDoajStatusSortRank(null), 3);
    assert.equal(getCurrentDoajStatusSortRank(undefined), 3);
  });

  await t.test('Route 2 (RejectedApplicationsPage) includes sortable Current DOAJ Status column and formatCurrentDoajStatusBadge', () => {
    const rejSrc = fs.readFileSync(path.join(__dirname, '../src/pages/RejectedApplicationsPage.tsx'), 'utf-8');
    assert.equal(rejSrc.includes('columnKey="currentStatus" label="Current DOAJ Status"'), true);
    assert.equal(rejSrc.includes('formatCurrentDoajStatusBadge'), true);
    assert.equal(rejSrc.includes('getCurrentDoajStatusSortRank'), true);
  });

  await t.test('Route 3 (RejectionHistoryPage) includes sortable Current DOAJ Status column and formatCurrentDoajStatusBadge', () => {
    const histSrc = fs.readFileSync(path.join(__dirname, '../src/pages/RejectionHistoryPage.tsx'), 'utf-8');
    assert.equal(histSrc.includes('columnKey="currentStatus" label="Current DOAJ Status"'), true);
    assert.equal(histSrc.includes('formatCurrentDoajStatusBadge'), true);
    assert.equal(histSrc.includes('getCurrentDoajStatusSortRank'), true);
  });

  await t.test('Route 4 (WithdrawnJournalsPage) includes sortable Current DOAJ Status column and formatCurrentDoajStatusBadge', () => {
    const withdrawnSrc = fs.readFileSync(path.join(__dirname, '../src/pages/WithdrawnJournalsPage.tsx'), 'utf-8');
    assert.equal(withdrawnSrc.includes('columnKey="currentStatus" label="Current DOAJ Status"'), true);
    assert.equal(withdrawnSrc.includes('formatCurrentDoajStatusBadge'), true);
    assert.equal(withdrawnSrc.includes('getCurrentDoajStatusSortRank'), true);
    assert.equal(withdrawnSrc.includes('Recorded Return Date'), true);
    assert.equal(withdrawnSrc.includes('Recorded Returns to DOAJ'), true);
  });

  await t.test('Route 6 (JournalExplorerPage) properly distinguishes chronological events from terminal observation', () => {
    const explorerSrc = fs.readFileSync(path.join(__dirname, '../src/pages/JournalExplorerPage.tsx'), 'utf-8');
    assert.equal(explorerSrc.includes('Undated or Date-Unverified Events (Accepted Records)'), true);
    assert.equal(explorerSrc.includes('Terminal Observation: Currently Indexed — 15 November 2026'), true);
    assert.equal(explorerSrc.includes('Subsequent application activity cannot be determined from the available data.'), true);
  });
});
