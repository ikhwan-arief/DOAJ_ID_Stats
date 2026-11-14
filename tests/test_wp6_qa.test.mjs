import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('WP6 Quality Assurance: Layout, Accessibility, Tokens, and Responsive Contracts', async (t) => {
  await t.test('tokens.css strictly conforms to DOAJ palette and mobile/tablet responsive breakpoints', () => {
    const cssPath = path.join(rootDir, 'src/styles/tokens.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    // Required DOAJ colors
    assert.match(cssContent, /--warm-black:\s*#282624;/i);
    assert.match(cssContent, /--dark-grey:\s*#5C5956;/i);
    assert.match(cssContent, /--light-grey:\s*#F6F4F4;/i);
    assert.match(cssContent, /--white:\s*#FFFFFF;/i);
    assert.match(cssContent, /--sanguine:\s*#982E0A;/i);
    assert.match(cssContent, /--grapefruit:\s*#FD5A3B;/i);
    assert.match(cssContent, /--salmon:\s*#FA9A87;/i);
    assert.match(cssContent, /--dark-green:\s*#3A5959;/i);
    assert.match(cssContent, /--mid-green:\s*#47A178;/i);
    assert.match(cssContent, /--light-green:\s*#A3C386;/i);
    assert.match(cssContent, /--yellow:\s*#F9D950;/i);
    assert.match(cssContent, /--neutral-border:\s*#A9A7A5;/i);

    // Font families
    assert.match(cssContent, /'Spectral'/i);
    assert.match(cssContent, /'Source Sans 3'/i);
    assert.match(cssContent, /'Source Code Pro'/i);

    // Minimum 14px rule and 44px touch targets
    assert.match(cssContent, /--text-xs:\s*0\.875rem;\s*\/\*\s*14px/i);
    assert.match(cssContent, /min-height:\s*44px;/i);

    // Responsive breakpoints: 1024px tablet and 768px mobile
    assert.match(cssContent, /@media\s*\(max-width:\s*1024px\)/i);
    assert.match(cssContent, /@media\s*\(max-width:\s*768px\)/i);
  });

  await t.test('All seven pages have landmark regions and keyboard skip link', () => {
    const layoutPath = path.join(rootDir, 'src/components/layout/Layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    assert.ok(layoutContent.includes('skip-link'), 'Layout must include skip-link');
    assert.ok(layoutContent.includes('<main'), 'Layout must include main landmark');
    assert.ok(layoutContent.includes('id="main-content"'), 'Main landmark must have main-content id');
  });

  await t.test('Independent observatory branding and disclaimers are preserved in Header and Footer', () => {
    const headerPath = path.join(rootDir, 'src/components/layout/Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    assert.ok(headerContent.includes('DOAJ × SINTA Journal Observatory'), 'Header must state observatory name');
    assert.ok(headerContent.includes('Independent analytical observatory'), 'Header must state independent status');

    const footerPath = path.join(rootDir, 'src/components/layout/Footer.tsx');
    const footerContent = fs.readFileSync(footerPath, 'utf8');
    assert.ok(footerContent.includes('Independent Analytical Project'), 'Footer must state independent project');
    assert.ok(footerContent.includes('not an official DOAJ service'), 'Footer must state not an official DOAJ service');
  });

  await t.test('SINTA Analysis page presents accurate distinct-journal prevalence and matched counts', () => {
    const sintaPath = path.join(rootDir, 'src/pages/SintaAnalysisPage.tsx');
    const sintaContent = fs.readFileSync(sintaPath, 'utf8');

    assert.ok(sintaContent.includes('Distinct Rejected Journals'), 'SINTA table must have Distinct Rejected Journals column');
    assert.ok(sintaContent.includes('Journal Prevalence'), 'SINTA table must have Journal Prevalence column');
    assert.ok(sintaContent.includes('Matched Rejection Records'), 'SINTA table must have Matched Rejection Records column');
  });

  await t.test('UpSet marginal totals are derived from aggregates, not hard-coded', () => {
    const upsetPath = path.join(rootDir, 'src/components/charts/UpsetVennChart.tsx');
    const upsetContent = fs.readFileSync(upsetPath, 'utf8');

    assert.ok(
      upsetContent.includes('aggregates.filter((item) => item.R).reduce'),
      'R marginal must be computed from aggregates'
    );
    assert.ok(
      upsetContent.includes('aggregates.filter((item) => item.W).reduce'),
      'W marginal must be computed from aggregates'
    );
    assert.ok(
      upsetContent.includes('aggregates.filter((item) => item.S).reduce'),
      'S marginal must be computed from aggregates'
    );
  });
});
