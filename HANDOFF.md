# Agent Handoff Log

**Project state:** Documentation package created. **No application code generated and no GitHub publication performed.**

## Current task
- Next owner: **Codex**
- Work package: **WP1**
- Goal: set up local privacy-safe repository and validated input/ISSN foundation.
- Prerequisites: source CSVs placed by user in `data/raw/`; Git initialized locally; master docs copied into project root.

## Handoff template (append a new entry after each task)
```text
Date/time:
Agent / package:
Git branch + commit SHA:
Changed files (safe filenames only):
Completed:
Tests executed + actual result:
Privacy/data review:
Open issues/risks:
Contract changes proposed:
Next owner + smallest next action:
```

## Standing blockers
- Do not publish until private field scan and user deployment approval.
- Never publish direct original DOAJ CSVs or private staging.
- SINTA `Editor URL` is an approved public editorial-team link (validate safe URL).
- DOAJ `URL in DOAJ`: safe Withdrawn `/toc/...` links can be public; all Rejected `/admin/application/...` links are INTERNAL and prohibited from public outputs unconditionally. Use separate validated public journal website fallback where available.
- Preserve placeholder ISSNs verbatim; do not use placeholder text as globally unique match key.

## Decision log
- 2026-11-15: English UI; full seven-page gradual build; independent project with DOAJ palette; GitHub public site after gates; Codex/Antigravity alternate.
- 2026-11-15: November SINTA replaces September SINTA; DOAJ source files remain original.
- 2026-11-15: DOAJ data approved for public reading, but DOAJ account personal fields prohibited; SINTA Editor URL explicitly considered public.

- 2026-11-15: User clarified DOAJ `URL in DOAJ` is intended as public journal profile information. Changed from categorical ban to conditional public link allowlist with record-level validation. Source inspection found Withdrawn `/toc/` and Rejected `/admin/application/`; internal admin paths are categorically barred from publication. Personal account field restrictions unchanged.


## Project-level completion condition
Work-package commits and handoffs are not final project completion. The final WP7 entry must include both the public GitHub repository URL and a **tested live GitHub Pages HTTPS URL**, deployed SHA, verified page/function checklist, and privacy-gate results. Use `RELEASE BLOCKED` rather than `DONE` if GitHub authentication, account settings, deployment or live verification cannot be completed.

## 2026-11-15 — WP1 completed

Date/time: 2026-11-15 06:21 WIB (UTC+7)

Agent / package: Codex / WP1

Git branch + commit SHA: `main` / `1fe9ed2` (`data: initialize privacy-safe ETL foundation`)

Changed files (safe filenames only): `.gitignore`; `data/public/manifest_public.json`; `observatory/{contracts,issn,privacy,sources}.py`; `schemas/public_record.schema.json`; `scripts/{inspect_sources,validate_public}.py`; `tests/test_*.py`; `pyproject.toml`; initial project contract/design documents.
Completed:
- Initialized the local repository on `main`; raw/private inputs, archives, secrets, diagnostics, caches, and build outputs are ignored.
- Validated only the three authorized inputs: Rejected 8,898 rows / 53 columns; Withdrawn 570 / 59; November SINTA 16,620 / 17. No obsolete September or cleaned-ISSN input is present.
- Added deterministic one-based source record IDs, lossless row iteration without deduplication, ISSN normalization/checksum/format/placeholder quality, explicit public-field allowlists, safe public URL handling, and a categorical internal DOAJ route block.
- Added a public-safe structural manifest with logical source labels, source hashes, counts, encoding, header hashes, source dates, schema version, and explicit ingest timestamp. Repeated generation produced identical SHA-256 `1f2c41e2709661c42733c5bbd4f40b5928aa03bb0bc4402f7cd85d2f95b636c0`.
- Conserved all 27,088 source rows in original order. The supplied data contain 37 exact occurrences of the required `XXXX-XXXX` / `0000-0XXX` literals; all remain raw-identical and classified as placeholders.

Tests executed + actual result:
- `python3 scripts/inspect_sources.py --output data/public/manifest_public.json --ingested-at 2026-11-14T23:21:17Z` — PASS; reported `rejected=8898, withdrawn=570, sinta=16620`.
- Full local-source conservation/required-placeholder assertion — PASS for 8,898 + 570 + 16,620 rows; 37 required-literal occurrences preserved.
- `python3 -m unittest discover -s tests -v` — PASS; 14 tests, 0 failures/errors.
- `python3 scripts/validate_public.py` — PASS; recursive scan of public output roots.
- `git diff --cached --check` and `python3 scripts/validate_public.py --staged` — PASS before implementation commit.

Privacy/data review: Only explicit safe paths were staged. `data/raw/`, local archives, private work, caches, and diagnostics were absent from the commit. The public manifest contains no raw filename, header list, source row, account value, email-shaped content, or internal application URL. Synthetic tests build the forbidden route from fictional components and perform no network request.

Open issues/risks: WP1 establishes inspection and lossless primitives only. Full public row projection, identity reconciliation, matching, metrics, and production exports remain assigned to later Codex packages. `pytest` was unavailable, so the zero-dependency suite uses `unittest`; no dependency was installed.

Contract changes proposed: None. Documentation-only safety normalization changed full internal-route examples to the non-clickable path form while preserving the existing policy.

Next owner + smallest next action: **Codex / WP3** — implement deterministic journal reconciliation, strict/extended ISSN matching, event chronology, repeated rejection record/date/year counts, S1–S6/NA/unmatched counts, and versioned public-safe exports.

## 2026-11-15 — WP2 completed

Date/time: 2026-11-15 06:30 WIB (UTC+7)

Agent / package: Antigravity / WP2

Git branch + commit SHA: `main` / `6e2e832` (`ui: implement React and Vite shell with DOAJ design tokens for WP2`)

Changed files (safe filenames only): `.gitignore`; `package.json`; `package-lock.json`; `tsconfig.json`; `vite.config.ts`; `index.html`; `src/main.tsx`; `src/App.tsx`; `src/styles/tokens.css`; `src/types/index.ts`; `src/data/synthetic.ts`; `src/components/common/UIPrimitives.tsx`; `src/components/common/GlobalFilterBar.tsx`; `src/components/layout/Header.tsx`; `src/components/layout/Footer.tsx`; `src/components/layout/Layout.tsx`; `src/pages/OverviewPage.tsx`; `src/pages/RejectedApplicationsPage.tsx`; `src/pages/RejectionHistoryPage.tsx`; `src/pages/WithdrawnJournalsPage.tsx`; `src/pages/SintaAnalysisPage.tsx`; `src/pages/JournalExplorerPage.tsx`; `src/pages/DataQualityPage.tsx`; `src/vite-env.d.ts`; `tests/test_ui_shell.test.mjs`.

Completed:
- Verified WP1 commit and clean tree.
- Built React 19 + TypeScript + Vite responsive frontend architecture.
- Implemented full CSS design tokens adhering strictly to DOAJ Manuscript specification (`--warm-black`, `--dark-grey`, `--light-grey`, `--white`, `--sanguine`, `--grapefruit`, `--salmon`, `--dark-green`, `--mid-green`, `--light-green`, `--yellow`, `--neutral-border`).
- Configured typography scale for Spectral (headings/display/KPIs), Source Sans 3 (body/controls), and Source Code Pro (ISSNs), ensuring a hard minimum font size constraint of 14px (`0.875rem`).
- Created accessible layout with skip-to-content link, 44x44px minimum interactive touch targets, mobile navigation drawer, and explicit independent analytical observatory branding in English without official DOAJ logo or implied endorsement.
- Implemented all seven navigable routes via hash-based routing compatible with GitHub Pages deep-linking and reload:
  1. `OverviewPage`: KPI cards, 3-set intersection partitions table (UpSet/Venn accessible tabular alternative), and observational framework.
  2. `RejectedApplicationsPage`: searchable record-level table, date/rank attributes, CSV export, and public profile links.
  3. `RejectionHistoryPage`: recurrence distribution (1x, 2x, 3x, >=4x), dated event timelines, and same-day repeat resilience.
  4. `WithdrawnJournalsPage`: withdrawal records, delisting dates, reinstatement flags, and status interpretation safeguards.
  5. `SintaAnalysisPage`: S1 through S6, NA (unaccredited), and unmatched census denominators (16,620 baseline).
  6. `JournalExplorerPage`: reconciled journal dossier, ISSN media pairs, public DOAJ `/toc/...` profile links, SINTA Editor URLs, and linked event timeline.
  7. `DataQualityPage`: documentation of placeholder ISSN preservation (`XXXX-XXXX`, `0000-0XXX`), deterministic matching modes, and dataset manifest.
- Used strictly synthetic test fixtures for WP2 scaffolding; no raw DOAJ or SINTA CSV records were read, moved, or serialized into frontend code.
- Enforced DOAJ link policy: public `/toc/...` profile links allowed, internal `/admin/application/...` paths categorically blocked.

Tests executed + actual result:
- `npm run typecheck` (`tsc --noEmit`) — PASS; 0 errors.
- `npm run build` (`tsc && vite build`) — PASS; production client build generated in `dist/`.
- `npm test` (`node --test`) — PASS; 6 frontend unit assertions passing (DOAJ tokens, 7 routes, privacy scanner, placeholder retention, independent branding).
- `python3 -m unittest discover -s tests -v` — PASS; 14 Python unit tests passing.
- `python3 scripts/validate_public.py` — PASS; recursive privacy scan passed.
- `python3 scripts/validate_public.py --staged` and `git diff --cached --check` — PASS before implementation commit.

Privacy/data review:
- Staged only reviewable TypeScript, CSS, HTML, and configuration files.
- Zero raw CSV files or private directories (`data/raw/`, `data/private_work/`) touched or included in frontend assets.
- Node modules added to `.gitignore`.
- Automated test asserted no internal `/admin/application/` URLs exist in `src/`.

Open issues/risks:
- Real analytics and Venn/UpSet partitions will be wired up in WP4 after Codex finishes the deterministic matching and data engine in WP3.

Contract changes proposed: None.

Next owner + smallest next action: **Codex / WP3** — read contracts and implement the deterministic journal reconciler, strict/extended ISSN matching with ambiguity detection, repeat frequency chronology, SINTA rank mapping, and versioned public-safe exports.
