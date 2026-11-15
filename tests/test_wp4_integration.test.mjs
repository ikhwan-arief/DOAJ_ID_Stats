import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('WP4 Production Integration: Real Validated Outputs & Quality Gates', async (t) => {
  await t.test('Public JSON files exist in public/data/v1 and match required baseline counts', () => {
    const summaryPath = path.join(rootDir, 'public/data/v1/summary_public.json');
    assert.ok(fs.existsSync(summaryPath), 'summary_public.json must exist in public/data/v1');

    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    assert.equal(summary.source_record_counts.rejected, 9308, 'Rejected source rows must be 9,308');
    assert.equal(summary.source_record_counts.accepted, 1421, 'Accepted source rows must be 1,421');
    assert.equal(summary.source_record_counts.withdrawn, 570, 'Withdrawn source rows must be 570');
    assert.equal(summary.source_record_counts.sinta, 16620, 'SINTA source rows must be 16,620');
    assert.equal(summary.source_record_counts.doaj_current_indonesia, 2733, 'Current DOAJ Indonesia records must be 2,733');
    assert.equal(summary.intersection_universe_count, 18404, 'Intersection universe must be 18,404');
    assert.equal(summary.repeat_record_journals, 2026, 'Repeat record journals must be 2,026');
    assert.equal(summary.repeat_date_journals, 2004, 'Repeat date journals must be 2,004');
    assert.equal(summary.repeat_year_journals, 1647, 'Repeat year journals must be 1,647');
  });

  await t.test('Current DOAJ dataset fact_doaj_current_public.json exists and reconciles', () => {
    const currentPath = path.join(rootDir, 'public/data/v1/fact_doaj_current_public.json');
    assert.ok(fs.existsSync(currentPath), 'fact_doaj_current_public.json must exist in public/data/v1');
    const records = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
    assert.equal(records.length, 2733, 'fact_doaj_current must contain exactly 2,733 records');

    const summaryPath = path.join(rootDir, 'public/data/v1/summary_public.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const cur = summary.current_doaj_summary;
    assert.ok(cur, 'current_doaj_summary must be present in summary');
    assert.equal(cur.indonesia_source_records, 2733);
    assert.equal(cur.unique_resolved_journals, 2731);
    assert.equal(cur.sinta_matched_journals, 2500);
    assert.equal(cur.doaj_only_journals, 231);
    assert.equal(cur.sinta_only_journals, 14120);
    assert.equal(cur.total_two_set_universe, 16851);
  });

  await t.test('All seven Venn regions add up to exact universe count', () => {
    const summaryPath = path.join(rootDir, 'public/data/v1/summary_public.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

    const sumCount = summary.venn_regions.reduce((acc, r) => acc + r.count, 0);
    assert.equal(sumCount, 18404, 'Sum of all 7 Venn partitions must equal exactly 18,404');
  });

  await t.test('No /admin/application/ route in built dist or src code', () => {
    const distDir = path.join(rootDir, 'dist');
    if (fs.existsSync(distDir)) {
      function scanDir(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
          } else if (file.endsWith('.js') || file.endsWith('.html')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const adminMatches = content.match(/https?:\/\/[^\s"']*\/admin\/application\/[^\s"']*/gi);
            assert.equal(adminMatches, null, `Forbidden admin route found in built asset ${file}`);
          }
        }
      }
      scanDir(distDir);
    }
  });

  await t.test('All SINTA ranks S1 through S6, NA, and unmatched are handled', () => {
    const summaryPath = path.join(rootDir, 'public/data/v1/summary_public.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

    const ranks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'NA'];
    for (const r of ranks) {
      assert.ok(summary.sinta_rank_source_record_counts[r] > 0, `SINTA rank ${r} must have positive count`);
    }
  });
});


test('Public Interface & Repository Cleanup Invariants', async (t) => {
  await t.test('Technical export descriptions are completely absent from public codebase and dist', () => {
    const forbiddenStrings = [
      'DOAJ Rejected Applications (2022–2026, exported 14 Nov 2026 22:08 UTC)',
      'DOAJ Last Withdrawn (2022–2026, exported 14 Nov 2026 22:08 UTC)',
    ];

    const dirsToScan = [path.join(rootDir, 'src'), path.join(rootDir, 'public')];
    if (fs.existsSync(path.join(rootDir, 'dist'))) {
      dirsToScan.push(path.join(rootDir, 'dist'));
    }

    function checkDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(fullPath);
        } else if (/\.(tsx?|jsx?|html|json|css)$/.test(entry.name)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const forbidden of forbiddenStrings) {
            assert.ok(
              !content.includes(forbidden),
              `Forbidden technical export description found in ${fullPath}`,
            );
          }
        }
      }
    }

    for (const d of dirsToScan) {
      checkDir(d);
    }
  });

  await t.test('Internal agent/protocol/design Markdown files are not in repository root', () => {
    const forbiddenFiles = [
      'AGENTS.md',
      'MASTER_PLAN.md',
      'DATA_CONTRACT.md',
      'METRICS_AND_MATCHING.md',
      'PRIVACY_AND_PUBLICATION.md',
      'DESIGN_PROTOCOL.md',
      'DOAJ-design-protocol-EN.md',
      'DOAJ-design-protocol-ID.md',
      'WORK_PACKAGES.md',
      'ACCEPTANCE_TESTS.md',
      'HANDOFF.md',
      'PROMPTS_FOR_AGENTS.md',
      'GITHUB_RELEASE.md',
      '00_README_START_HERE.md',
    ];

    for (const file of forbiddenFiles) {
      assert.ok(
        !fs.existsSync(path.join(rootDir, file)),
        `Internal file ${file} should have been removed from repository root`,
      );
    }
  });
});
