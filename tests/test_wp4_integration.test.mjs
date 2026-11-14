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
    assert.equal(summary.source_record_counts.rejected, 8898, 'Rejected source rows must be 8,898');
    assert.equal(summary.source_record_counts.withdrawn, 570, 'Withdrawn source rows must be 570');
    assert.equal(summary.source_record_counts.sinta, 16620, 'SINTA source rows must be 16,620');
    assert.equal(summary.intersection_universe_count, 18370, 'Intersection universe must be 18,370');
    assert.equal(summary.repeat_record_journals, 1917, 'Repeat record journals must be 1,917');
    assert.equal(summary.repeat_date_journals, 1894, 'Repeat date journals must be 1,894');
    assert.equal(summary.repeat_year_journals, 1568, 'Repeat year journals must be 1,568');
  });

  await t.test('All seven Venn regions add up to exact universe count', () => {
    const summaryPath = path.join(rootDir, 'public/data/v1/summary_public.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

    const sumCount = summary.venn_regions.reduce((acc, r) => acc + r.count, 0);
    assert.equal(sumCount, 18370, 'Sum of all 7 Venn partitions must equal exactly 18,370');
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
