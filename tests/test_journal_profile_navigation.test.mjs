/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  formatMatchingMethod,
  formatMatchStatus,
  formatMatchingMode,
  getMatchingExplanation,
} from '../src/lib/matchingLabels.ts';
import {
  isValidIssnChecksum,
  buildJournalIdentityIndex,
  getJournalProfileRoute,
} from '../src/lib/journalRoutes.ts';

const rootDir = process.cwd();

test('1 & 2: Supported matching-code labels and unknown code fallback', () => {
  assert.equal(formatMatchingMethod('e_to_e'), 'Matched by Online ISSN');
  assert.equal(formatMatchingMethod('p_to_p'), 'Matched by Print ISSN');
  assert.equal(formatMatchingMethod('p_to_p_fallback'), 'Matched by Print ISSN');
  assert.equal(formatMatchingMethod('e_to_p'), 'Matched using Online to Print ISSN');
  assert.equal(formatMatchingMethod('p_to_e'), 'Matched using Print to Online ISSN');
  assert.equal(formatMatchingMethod('e_to_p+p_to_e'), 'Matched using Cross-Medium ISSNs');
  assert.equal(formatMatchingMethod('no_usable_issn'), 'No usable or valid ISSN in source');
  assert.equal(formatMatchingMethod('unknown_custom_code'), 'unknown custom code');
  assert.equal(formatMatchingMethod(null), 'No match evaluated');

  assert.equal(formatMatchStatus('matched'), 'Journal identity matched');
  assert.equal(formatMatchStatus('unmatched'), 'No matching journal found');
  assert.equal(formatMatchStatus('ambiguous'), 'Multiple possible matches');
  assert.equal(formatMatchStatus(null), 'Not Evaluated');

  assert.equal(formatMatchingMode('strict'), 'Standard ISSN matching');
  assert.equal(formatMatchingMode('extended'), 'Expanded ISSN matching');

  const expMatched = getMatchingExplanation('matched', 'e_to_e');
  assert.match(expMatched, /Cross-referenced with national SINTA database via Matched by Online ISSN/);
  const expUnmatched = getMatchingExplanation('unmatched');
  assert.match(expUnmatched, /not DOAJ indexing status/);
});

test('3, 4, 5, 6, 7: ISSN checksum validity, placeholder rejection, and identity index resolution', () => {
  // Checksum validity tests
  assert.equal(isValidIssnChecksum('2252-6617'), true);
  assert.equal(isValidIssnChecksum('2656-9779'), true);
  assert.equal(isValidIssnChecksum('2808-554X'), true);
  assert.equal(isValidIssnChecksum('XXXX-XXXX'), false);
  assert.equal(isValidIssnChecksum('0000-0XXX'), false);
  assert.equal(isValidIssnChecksum('1234-5678'), false); // invalid checksum
  assert.equal(isValidIssnChecksum(''), false);
  assert.equal(isValidIssnChecksum(null), false);

  // Test index building with mock data
  const mockJournals = [
    { journal_id: 'j1', display_title: 'Journal Alpha', sinta_rank: 'S1', in_rejected: false, in_withdrawn: false, in_sinta: true },
    { journal_id: 'j2', display_title: 'Journal Beta', sinta_rank: 'S2', in_rejected: false, in_withdrawn: false, in_sinta: true },
    { journal_id: 'j3_ambig_1', display_title: 'Journal Gamma A', sinta_rank: 'S3', in_rejected: false, in_withdrawn: false, in_sinta: true },
    { journal_id: 'j3_ambig_2', display_title: 'Journal Gamma B', sinta_rank: 'S3', in_rejected: false, in_withdrawn: false, in_sinta: true },
    { journal_id: 'j_no_issn', display_title: 'Journal Delta', sinta_rank: 'NA', in_rejected: false, in_withdrawn: false, in_sinta: true },
  ];

  const mockSinta = new Map([
    ['j1', { journal_id: 'j1', e_issn_normalized: '2252-6617', e_issn_quality: 'checksum_valid', p_issn_normalized: null, p_issn_quality: 'missing' }],
    ['j2', { journal_id: 'j2', e_issn_normalized: null, e_issn_quality: 'missing', p_issn_normalized: '2656-9779', p_issn_quality: 'checksum_valid' }],
    ['j3_ambig_1', { journal_id: 'j3_ambig_1', e_issn_normalized: '2088-8708', e_issn_quality: 'checksum_valid', p_issn_normalized: null, p_issn_quality: 'missing' }],
    ['j3_ambig_2', { journal_id: 'j3_ambig_2', e_issn_normalized: '2088-8708', e_issn_quality: 'checksum_valid', p_issn_normalized: null, p_issn_quality: 'missing' }],
    ['j_no_issn', { journal_id: 'j_no_issn', e_issn_normalized: 'XXXX-XXXX', e_issn_quality: 'placeholder', p_issn_normalized: null, p_issn_quality: 'missing' }],
  ]);

  const index = buildJournalIdentityIndex(mockJournals, mockSinta, null, null, null, null);

  // 3. Unique e-ISSN resolves to journal
  assert.equal(index.issnToUniqueJournal.get('2252-6617'), 'j1');
  assert.equal(index.journalToCanonicalSlug.get('j1'), '2252-6617');
  assert.equal(getJournalProfileRoute('j1', index), '#/journal/2252-6617');

  // 4. p-ISSN fallback when e-ISSN not present
  assert.equal(index.issnToUniqueJournal.get('2656-9779'), 'j2');
  assert.equal(index.journalToCanonicalSlug.get('j2'), '2656-9779');
  assert.equal(getJournalProfileRoute('j2', index), '#/journal/2656-9779');

  // 5. Placeholder ISSN rejected from index
  assert.equal(index.issnToUniqueJournal.has('XXXX-XXXX'), false);

  // 6. Ambiguous ISSN not mapped to unique journal, but in ambiguousIssns map
  assert.equal(index.issnToUniqueJournal.has('2088-8708'), false);
  assert.ok(index.ambiguousIssns.has('2088-8708'));
  assert.deepEqual(index.ambiguousIssns.get('2088-8708'), ['j3_ambig_1', 'j3_ambig_2']);
  assert.equal(getJournalProfileRoute('j3_ambig_1', index), '#/journal/id:j3_ambig_1');

  // 7. Journal without usable ISSN falls back to opaque public-safe id
  assert.equal(getJournalProfileRoute('j_no_issn', index), '#/journal/id:j_no_issn');
});

test('8 to 20: Router, navigation components, Back buttons, and privacy safeguards', () => {
  // BackNavigation component exists
  const backNavPath = path.join(rootDir, 'src/components/common/BackNavigation.tsx');
  assert.ok(fs.existsSync(backNavPath), 'BackNavigation component file must exist');

  // App.tsx router supports journal hash routes and Back navigation
  const appSource = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
  assert.match(appSource, /journal\//, 'App.tsx must parse journal/ routes');
  assert.match(appSource, /handleBackNavigation/, 'App.tsx must define back navigation handler');
  assert.match(appSource, /previousRouteRef/, 'App.tsx must track previous route history');

  // JournalExplorerPage.tsx has Copy Journal Link and BackNavigation
  const explorerSource = fs.readFileSync(path.join(rootDir, 'src/pages/JournalExplorerPage.tsx'), 'utf8');
  assert.match(explorerSource, /Copy Journal Link/, 'JournalExplorerPage must contain Copy Journal Link button');
  assert.match(explorerSource, /<BackNavigation/, 'JournalExplorerPage must render BackNavigation component');
  assert.match(explorerSource, /Multiple Journals Share ISSN/, 'JournalExplorerPage must render disambiguation view');

  // Ensure no /admin/ routes are linked
  assert.doesNotMatch(explorerSource, /\/admin\//, 'JournalExplorerPage must never link /admin/ routes');
});
