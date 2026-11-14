# Acceptance, Quality Gates and Test Matrix

## Data invariants (Codex)
- [ ] Input schema and latest SINTA file checked; 8,898 Rejected / 570 Withdrawn / 16,620 SINTA baseline source row counts verified independently.
- [ ] Source row count preserved in private staging and one-to-one public-safe fact rows; no dropped duplicates.
- [ ] Literal `XXXX-XXXX`, `0000-0XXX` and all input ISSN values preserved as raw fields; no replacement with null or invented checksum.
- [ ] Strict e-to-e / p-to-p fallback executed exactly; extended mode separate; ambiguous collisions kept distinct.
- [ ] Rejection records counted distinctly from distinct event days, years, and unique reconciled journals.
- [ ] SINTA S1, S2, S3, S4, S5, S6, NA and unmatched all accounted for. Snapshot date stated.
- [ ] All seven Venn/UpSet intersection partitions add to correct universe and marginals, with unresolved excluded and counted explicitly.
- [ ] No multiplicative raw joins. Aggregate by journal id before set intersection or temporal grouping.
- [ ] Random/stratified manual samples for identity matches, placeholder collisions, cross-medium conflicts and repeated timestamps reviewed; sample IDs only (no private content) in public reports.
- [ ] Output deterministic on repeat run (identical schema/content hashes) given same inputs and toolchain.

## Privacy/build/security (Codex)
- [ ] Forbidden account fields `Owner`, `Account Name`, `Account Email` absent from public data, frontend bundles, logs, downloadable exports and preview artifacts.
- [ ] `URL in DOAJ` displays only validated public journal-profile links such as `/toc/...`. Every `/admin/application/` route is categorically blocked from public exports, HTML, JavaScript bundles, links, logs, Git staging/history, and downloadable files, regardless of authentication status.
- [ ] Email-pattern values, credential/query tokens and private/admin host URLs flagged or blocked in every exported field including nested objects.
- [ ] SINTA `Editor URL` appears only as safe `http(s)` public editorial-team link.
- [ ] `git ls-files`, `git diff --cached`, all repository history and `dist/` checked for private/raw data before publish.
- [ ] Use fictional synthetic strings in tests. Security scans must not print real sensitive values.
- [ ] CI prevents publish on privacy/data/type/test/build failures.

## UI/visual (Antigravity)
- [ ] Seven pages accessible through keyboard nav and working internal routes, including GitHub Pages refresh/deep-link strategy.
- [ ] Shared global filter state; filters drive every relevant chart, KPIs, table and exports. Drill-down records match labels.
- [ ] Venn and UpSet exact marginal/count agreement; tabular accessible equivalent.
- [ ] Rejection timeline handles same-day repeated records and absent dates; gap statistics match backend.
- [ ] Every SINTA rank visible, including NA and unmatched; percentages have correct SINTA denominator.
- [ ] Chart colors/tokens conform to DOAJ-derived protocol, no unsupported affiliation, font size ≥14px and adequate contrast.
- [ ] Test desktop ≥1280px, tablet 769–1279px and mobile 375–768px; navigation, tables, charts and export usable.
- [ ] Screen reader/keyboard smoke test (VoiceOver or equivalent), focus trap in dialogs, alt/aria and readable table headings.
- [ ] Performance on representative lower-powered device and bundle/memory usage documented; huge tables virtualized or paginated.

## Release documentation
- [ ] `README` explains how to run ETL locally, install/build frontend, privacy gate and deploy.
- [ ] Public site shows exact snapshot, metrics methodology, DOI/ISSN limitations, independent identity and citations/attribution as applicable.
- [ ] Users can reach source-linked journal records without ever seeing DOAJ account details.
- [ ] User-approved public repository push and deployment completed after privacy/quality gates passed.

## CI test proposal
`python -m pytest`, ETL determinism test, `python scripts/validate_public.py`, `npm run typecheck`, `npm test`, `npm run build`, secret/PII scan of `dist` and tracked files, optional Playwright accessibility smoke test. Exact commands depend on implementation; **do not report success unless run**.

## Hard exclusion regression

- [ ] Synthetic test fixtures assert any case-insensitive URL containing `/admin/application/` is rejected before public export or rendering, even if its hostname is `doaj.org` and even if a request would succeed.
- [ ] CI scans all generated public outputs, staged files, release assets, and logs for `/admin/application/` URL patterns; zero matches are permitted. Documentation can mention the path only as a safety rule, not a clickable URL or actual private URL.


## Mandatory final live-site acceptance
- [ ] All seven **completed**, data-driven pages work with the November 2026 SINTA snapshot and approved DOAJ exports; no synthetic placeholder metrics on production.
- [ ] Public-safe exports and built assets recursively pass field, PII, and forbidden `/admin/application/` path checks, including browser downloads.
- [ ] Approved source and generated artifacts are pushed to a **public** GitHub repository (raw CSVs excluded and ignored).
- [ ] GitHub Pages deployment workflow completed successfully for the intended SHA.
- [ ] Public HTTPS URL tested from an unauthenticated browser; all seven pages and direct navigation work.
- [ ] Real charts, Venn/UpSet, global filters, repeat history, journal explorer, and exports verified on production.
- [ ] Browser console/network has no blocking errors, and public artifact payloads contain no account PII or internal DOAJ admin URLs.
- [ ] README and `HANDOFF.md` record working repository/site URLs, release SHA and tests.
- [ ] If permissions/credentials block publication, status remains **BLOCKED**, not complete.
The user has already requested and authorized the public outcome subject to passing these checks.
