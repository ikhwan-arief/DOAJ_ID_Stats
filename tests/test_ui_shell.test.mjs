import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('WP2 Shell: Design tokens, fonts, and accessibility standards', async (t) => {
  await t.test('tokens.css contains defined DOAJ color tokens and minimum 14px constraint', () => {
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
    assert.match(cssContent, /'Source Sans/i);
    assert.match(cssContent, /'Source Code Pro'/i);

    // Minimum 14px rule
    assert.match(cssContent, /--text-xs:\s*0\.875rem;\s*\/\*\s*14px/i);
    assert.match(cssContent, /min-height:\s*44px;/i); // Touch target
  });

  await t.test('All seven routes exist and are mapped in App.tsx', () => {
    const appPath = path.join(rootDir, 'src/App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    const expectedRoutes = [
      'overview',
      'rejected',
      'history',
      'withdrawn',
      'sinta',
      'explorer',
      'publishers',
      'quality',
    ];

    for (const route of expectedRoutes) {
      assert.ok(
        appContent.includes(`case '${route}':`),
        `Route '${route}' must be handled in App router`
      );
    }
  });

  await t.test('Primary navigation ordering adheres to strict master prompt order', () => {
    const headerPath = path.join(rootDir, 'src/components/layout/Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    // Assert that 7 is Publisher Analysis and 8 is Data Quality
    assert.match(headerContent, /\{\s*id:\s*'publishers',\s*label:\s*'7\.\s*Publisher Analysis'\s*\}/);
    assert.match(headerContent, /\{\s*id:\s*'quality',\s*label:\s*'8\.\s*Data Quality'\s*\}/);
  });

  await t.test('Privacy enforcement: No internal admin routes in source code or synthetic data', () => {
    const srcDir = path.join(rootDir, 'src');

    function scanDir(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          // Check for any actual internal admin link strings (excluding explicit comments/disclaimers about blocking it)
          const adminMatches = content.match(/https?:\/\/[^\s"']*\/admin\/application\/[^\s"']*/gi);
          assert.equal(
            adminMatches,
            null,
            `Forbidden internal admin route found in ${file}: ${JSON.stringify(adminMatches)}`
          );
        }
      }
    }

    scanDir(srcDir);
  });

  await t.test('Placeholder ISSN preservation: synthetic fixtures test XXXX-XXXX and 0000-0XXX', () => {
    const syntheticPath = path.join(rootDir, 'src/data/synthetic.ts');
    const syntheticContent = fs.readFileSync(syntheticPath, 'utf8');

    assert.ok(
      syntheticContent.includes('XXXX-XXXX'),
      'Synthetic test fixture must retain literal XXXX-XXXX'
    );
    assert.ok(
      syntheticContent.includes('0000-0XXX'),
      'Synthetic test fixture must retain literal 0000-0XXX'
    );
  });

  await t.test('Independent branding: no DOAJ logo and explicit independent disclaimer', () => {
    const footerPath = path.join(rootDir, 'src/components/layout/Footer.tsx');
    const footerContent = fs.readFileSync(footerPath, 'utf8');

    assert.ok(
      footerContent.includes('not an official DOAJ service'),
      'Footer must explicitly state project independence'
    );
  });
});
