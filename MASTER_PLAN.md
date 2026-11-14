# Master Plan — DOAJ × SINTA Journal Observatory

## Product declaration
- **Public product name:** DOAJ × SINTA Journal Observatory (working name).
- **Status:** Independent analytical observatory. **Not an official DOAJ endorsement or DOAJ status service.**
- **UI language:** English. **Scope:** seven complete pages, released incrementally only after passing gates.
- **Primary audience:** journal editors, research administrators, scholarly communications researchers, and the public.
- **Data:** DOAJ Rejected (2022–2026); DOAJ Withdrawn (2022–2026); SINTA snapshot 2026-11-15. DOAJ files exported 2026-11-14 UTC. Display exact dates and sources.
- **Hosting:** public GitHub repository and GitHub Pages, after privacy validation and passing acceptance gates.

## Analytical questions
1. Which journals have records of rejected DOAJ applications, and what attributes exist in the source?
2. Which journals have recorded DOAJ withdrawals and reinstatements, and when?
3. What is the frequency and chronology of repeated rejection **records** by journal?
4. What are overlaps among Rejected, Withdrawn, and SINTA journal sets, for **all** S1–S6, NA, and unmatched categories?
5. What patterns are evident, and what data limitations prevent causal/status interpretations?

## Seven interconnected pages
1. **Overview:** unique journals vs records, exact denominators, event trends, Venn and optional UpSet, data coverage.
2. **Rejected Applications:** searchable record-level table with public source attributes, date, rank as-of snapshot, link to journal profile, export current filtered rows.
3. **Rejection History:** frequency distribution, dated event timeline, gaps, year-by-rank heatmap, same-day records; drill-down per journal.
4. **Withdrawn Journals:** source records, withdrawal date, reinstatement date where present, overlap, rank, public attributes; do not call a record 'currently withdrawn' without independent live verification.
5. **SINTA Analysis:** S1–S6, NA/unmatched; unique-journal prevalence within SINTA population, record counts, subject breakdowns and comparisons.
6. **Journal Explorer:** reconciled journal identity, both ISSNs, validated public DOAJ `/toc/...` profile links only (never internal `/admin/application/...`), other public URLs including SINTA Editor URL, all linked event records, provenance/match confidence.
7. **Data Quality & Methodology:** placeholders, collision/ambiguity, checksum quality, matching modes, unmatched, denominators, data versions, privacy disclosure.

## Architecture
- Python (pandas), schemas and pytest for reproducible ETL. Source files local-only. Deterministic registry and match audit output.
- React + TypeScript + Vite. Static client-side typed data or partitioned JSON. ECharts for supported charts; SVG Venn if validated; UpSet alternative for exact intersection sizes; TanStack Table with virtualization if needed.
- GitHub Actions for test, build and staged deployment. Nothing requiring secrets is shipped to browser. Public build generated only from approved exports.
- All visualizations use shared semantic data types, filter state and derived analytics functions. Do not implement independent metric calculations inside chart components.

## Phases / gates
- **Gate 0:** raw source check, `.gitignore`, privacy schema, baseline metadata, no public push.
- **Gate 1:** accepted data contract, clean privacy-safe output, reproducible metric tests.
- **Gate 2:** shared UI shell + DOAJ-consistent design + mobile accessibility.
- **Gate 3:** every required chart and page derives from same verified outputs; temporal/overlap assertions pass.
- **Gate 4:** performance, link safety, browser-based accessibility, privacy leak checks, GitHub Pages preview.
- **Gate 5:** user-authorized public push/deploy after passing privacy inventory, Git staging, and live-site verification. User has already approved the final public outcome.

## Product behavior
- Global filters: time range (with clear date field semantics), SINTA rank (S1–S6, NA, unmatched), event kind, subject (direct vs inferred labeled), strict/extended matching view, journal search.
- Cross-filtering: chart segments navigate to a filtered source-record or journal table. No fake links or uncoupled interactions.
- Every KPI/chart has unit ('source records', 'distinct dates', 'reconciled journals'), denominator, as-of date, provenance/definition tooltip.
- Charts should never imply rejection is proof of misconduct or a SINTA rank at time of rejection. Source references and methodology are in the site footer.
- Visible download/export uses **only** privacy-approved values and obeys filters.

## Non-goals for first release
- Backend login, live DOAJ/SINTA status checks, historical reconstruction of changing SINTA grades, inferred rejection causes, editor/owner identity analytics, AI scoring of journal quality.

## Decisions
Fixed: English, seven pages, independent branding, supplied DOAJ palette, latest November SINTA, placeholders retained, all rank categories, public GitHub target, Codex/Antigravity alternating.
Open only if required: dataset output format/performance tradeoffs, per-field public allowlist refinements, ambiguous journal identity resolution and confirmed GitHub repo name. Record decisions in `HANDOFF.md`.


## Non-negotiable definition of done (production)
The project is **NOT DONE** when its documentation, design mockups, sample charts, local build, PR, or deploy-ready branch is complete. It is DONE only when:
1. All seven pages are implemented, use actual reviewed public-safe data, and pass agreed functional/analytical tests.
2. All source preservation, identity/repeat metrics, privacy allowlist, and forbidden-URL checks pass, including scanning shipped bundles and downloads.
3. Code and only approved public-safe generated data are in a **public GitHub repository** with a functioning CI workflow.
4. GitHub Pages deployment has completed successfully and the final **public HTTPS URL** has been opened and checked for availability, seven working pages, visualizations, filters, journal drill-downs, downloads, and mobile layout.
5. Final report states repository URL, live dashboard URL, deployment commit SHA, exact tests run, and any outstanding limitations.
The user already authorizes the public outcome. Request only indispensable GitHub connection/account or repository naming input if unavailable. Do not release or push when privacy/security checks fail.
