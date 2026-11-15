import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatCurrentDoajStatusBadge } from '../src/lib/matchingLabels.ts';

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

  await t.test('Route 4 (WithdrawnJournalsPage) has no Current DOAJ Status table header', () => {
    const withdrawnSrc = fs.readFileSync(path.join(__dirname, '../src/pages/WithdrawnJournalsPage.tsx'), 'utf-8');
    assert.equal(withdrawnSrc.includes('label="Current DOAJ Status"'), false, 'WithdrawnJournalsPage must not include Current DOAJ Status in table');
    assert.equal(withdrawnSrc.includes('Recorded Return Date'), true, 'WithdrawnJournalsPage should use neutral Recorded Return Date label');
    assert.equal(withdrawnSrc.includes('Recorded Returns to DOAJ'), true, 'WithdrawnJournalsPage KPI should use neutral Recorded Return label');
  });

  await t.test('Route 2 (RejectedApplicationsPage) includes Current DOAJ Status column and formatCurrentDoajStatusBadge', () => {
    const rejSrc = fs.readFileSync(path.join(__dirname, '../src/pages/RejectedApplicationsPage.tsx'), 'utf-8');
    assert.equal(rejSrc.includes('Current DOAJ Status'), true);
    assert.equal(rejSrc.includes('formatCurrentDoajStatusBadge'), true);
  });

  await t.test('Route 6 (JournalExplorerPage) properly distinguishes chronological events from terminal observation', () => {
    const explorerSrc = fs.readFileSync(path.join(__dirname, '../src/pages/JournalExplorerPage.tsx'), 'utf-8');
    assert.equal(explorerSrc.includes('Undated or Date-Unverified Events (Accepted Records)'), true);
    assert.equal(explorerSrc.includes('Terminal Observation: Currently Indexed — 15 November 2026'), true);
    assert.equal(explorerSrc.includes('Subsequent application activity cannot be determined from the available data.'), true);
  });
});
