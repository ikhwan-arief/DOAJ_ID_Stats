import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('SINTA Profile URL Integrity and Multi-Candidate Audit Invariants', async (t) => {
  const dataQualityPath = path.resolve('public/data/v1/data_quality_public.json');
  assert.ok(fs.existsSync(dataQualityPath), 'data_quality_public.json must exist');

  const content = JSON.parse(fs.readFileSync(dataQualityPath, 'utf8'));
  const entries = content.sinta_matching_audit?.entries || [];
  assert.ok(entries.length > 0, 'Matching audit entries must not be empty');

  await t.test('No audit entry contains pipe-separated sinta_urls string', () => {
    for (const e of entries) {
      assert.ok(!e.sinta_urls.includes('|'), `Found pipe in sinta_urls for ${e.journal_title}: ${e.sinta_urls}`);
      assert.ok(!e.sinta_urls.includes('%7C'), `Found encoded pipe in sinta_urls for ${e.journal_title}`);
    }
  });

  await t.test('Perspektif Hukum candidate profiles are separated standalone links', () => {
    const ph = entries.find((e) => e.journal_title === 'Perspektif Hukum');
    assert.ok(ph, 'Perspektif Hukum audit row must exist');
    assert.ok(Array.isArray(ph.sinta_profiles), 'sinta_profiles must be an array');
    assert.equal(ph.sinta_profiles.length, 2, 'Must have 2 candidates: 4554 and 11467');
    const ids = ph.sinta_profiles.map((p) => p.profile_id);
    assert.deepEqual(ids, ['4554', '11467']);
    assert.equal(ph.sinta_profiles[0].url, 'https://sinta.kemdiktisaintek.go.id/journals/profile/4554');
    assert.equal(ph.sinta_profiles[1].url, 'https://sinta.kemdiktisaintek.go.id/journals/profile/11467');
    assert.equal(ph.confirmed_sinta_url, null, 'Unresolved candidate must not have confirmed_sinta_url');
  });

  await t.test('All sinta_profiles URLs adhere to strict schema', () => {
    const sintaRegex = /^https:\/\/sinta\.kemdiktisaintek\.go\.id\/journals\/profile\/\d+$/;
    for (const e of entries) {
      if (e.sinta_profiles) {
        for (const p of e.sinta_profiles) {
          assert.match(p.url, sintaRegex, `Candidate URL invalid: ${p.url}`);
        }
      }
      if (e.confirmed_sinta_url) {
        assert.match(e.confirmed_sinta_url, sintaRegex, `Confirmed URL invalid: ${e.confirmed_sinta_url}`);
      }
    }
  });
});
