# Alternating Work Packages and Ownership

**Rule:** Codex → Antigravity → Codex → Antigravity → Codex → Antigravity → Codex. One owner at a time, small commits, short handoff. Read `AGENTS.md` first. This is a work **sequence**, not permission to execute future packages automatically.

| Package | Owner | Scope / subdeliverables | Gate |
|---|---|---|---|
| WP1 | **Codex** | Repository scaffold, `.gitignore`, input inspector, privacy-safe schema, deterministic IDs, ISSN parser and quality tests, JSON schema and test fixtures (synthetic) | No source loss, placeholders untouched, raw never staged |
| WP2 | **Antigravity** | Vite/React shell, CSS tokens and fonts, nav and page framework for seven routes, cards/tables/shared filter components using synthetic safe fixtures | Responsive + accessible, no invented metrics |
| WP3 | **Codex** | Full identity reconciler, strict/extended matching, repeat frequency and time, SINTA rank as-of, Venn/UpSet region tables, public safe exports, quality report and regression tests | Every aggregate reconciles to public safe source rows |
| WP4 | **Antigravity** | Implement all seven pages incrementally: overview, rejected, history, withdrawn, SINTA, journal explorer, quality; linked charts, tooltips, accessible tables, export | No chart-local independent totals; count drilldowns reconcile |
| WP5 | **Codex** | End-to-end metric cross-check, privacy scans, JS/JSON bundle audit, typecheck/build/performance, GitHub Actions CI + staging build | Gate blocks wrong counts or sensitive files |
| WP6 | **Antigravity** | Visual QA across breakpoints, keyboard/screen reader review, UX refinements, Venn/UpSet readability, browser smoke tests | DOAJ protocol and WCAG AA acceptance |
| WP7 | **Codex** | Final source/version docs, artifact manifest, PR/release guide, confirm protected publish path; deploy **after required privacy/acceptance gates pass, as already authorized by the user** | Release/privacy checklist signed off |

## WP4 slices for token economy
WP4a shared chart primitives + filters; WP4b Overview and intersection drilldowns; WP4c Rejected and Withdrawn tables; WP4d Rejection History; WP4e SINTA Analysis; WP4f Journal Explorer; WP4g Data Quality; WP4h integration pass. Create a commit+handoff after each slice if necessary.

## Required handoff fields
Owner, package/subtask, commit SHA, changed files, completed acceptance items, exact tests run/result, unresolved issues, contract changes proposed (not unilaterally adopted), next agent's smallest task. Do not paste source rows or private values.

## Dependency rules
- WP2 uses **synthetic** examples if public safe ETL is not yet available. Do not copy raw DOAJ rows into frontend fixtures.
- WP4 cannot ship true KPI values before WP3 validates identity/match methods.
- WP5 must fail release if the frontend imports or embeds `data/raw`, direct original CSV, forbidden source fields or internal admin URLs.
- WP7 public push/deploy is authorized by the user conditional on passing privacy and acceptance tests.

## DOAJ link policy applied to WP1, WP3, WP4 and WP5
Implement `URL in DOAJ` as a mixed-purpose field: validated `https://doaj.org/toc/...` journal-profile links may be public; **every** value using the `/admin/application/...` path is internal and must be blocked categorically, never probed for public access, exposed, exported, committed, or logged. Test with fictional synthetic URL strings only. Show separate validated public journal website links where available. Preserve original values only in ignored local source files.


## Production completion rule (supersedes release-candidate-only wording)
WP1–WP6 are sequential milestones; only WP7 may declare the overall project complete. **WP7 is deploy-and-verify, not merely prepare-release.** Once privacy/security and acceptance gates pass, Codex must create or use the public repository, push, activate GitHub Pages, verify the live public website, and repair deployment problems. This final publication is explicitly authorized by the user, so do not stop solely to seek repeat generic approval. Escalate only user-only GitHub authorization, repository owner/name, or account settings that are actually required. A blocker must be described accurately; a local successful build is not a published dashboard.
