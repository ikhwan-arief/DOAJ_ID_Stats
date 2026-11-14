# Privacy, Data Safety and Public Release Gate

## Authorization and boundaries
The user states the DOAJ data are authorized for **public reading**. This permission is accepted for the project. It does not override the separate instruction: **do not expose personal data publicly**. Data minimization applies to Git, deployed JS/JSON, downloads, screenshots, CI logs, cache and commit history.

## Explicit sensitivity classifications
| Field/data | Policy | Reason |
|---|---|---|
| DOAJ `Owner` | **NEVER PUBLIC** | private account/ownership attribute |
| DOAJ `Account Name` | **NEVER PUBLIC** | individual identity |
| DOAJ `Account Email` | **NEVER PUBLIC** | contact identifier |
| DOAJ `URL in DOAJ` | **ALLOW PUBLIC `/toc/...` ONLY; DENY INTERNAL `/admin/application/...`** | public journal-profile URL values only, with categorical block for internal application routes |
| Local raw DOAJ CSVs / raw SINTA CSV | **NEVER GIT/PAGES** | may contain private or unreviewed columns |
| `data/private_work/`, diagnostic dumps, raw exception prints | **NEVER PUBLIC** | secondary leakage risk |
| SINTA `Editor URL` | **ALLOW** | user confirms link is public Editorial Team journal page; validate normal public URL |
| SINTA `Google Scholar URL`, `Website URL`, `Sinta URL` | **ALLOW after URL safety check** | public resource links |
| DOAJ public journal/publisher/policy metadata | **REVIEW / ALLOWLIST** | field-wise publication approval |
| Free text, embedded query strings and unknown columns | **DENY BY DEFAULT** | can hide personal or admin data |

**Final user decision:** the `/admin/application/...` path is an INTERNAL application route and must not be accessible via the public dashboard. The 8,898 Rejected values using this path are categorically excluded from every public export, link, data bundle, log, search index, downloadable file, and Git commit. Do **not** attempt to establish public availability through anonymous-access probes; accessibility does not override this ban. The 570 Withdrawn `https://doaj.org/toc/...` values are eligible after normal URL safety validation. For Rejected journal links, use a separately validated public journal website URL if available, or show no DOAJ profile link. Keep original internal values in local ignored raw files only. `Editor URL` is a public editorial-team page, not permission to scrape personal details.

## Build and publication safeguards
1. Make `.gitignore` first: `data/raw/`, `data/private_work/`, `.env*`, secrets, private reports, local browser dumps; prevent upload via Git hooks if configured.
2. Build public exports from an **explicit allowlist schema**. Never serialize entire input CSV objects with excluded fields afterward.
3. Type-check approved public outputs, safe URLs, text length and identifiers. Never include email, account name, or owner columns.
4. Reject dangerous URL schemes, query tokens, credentials, suspicious internal hosts and unverified privileged routes. For `URL in DOAJ`, require `https`, `doaj.org` (or an explicitly reviewed DOAJ subdomain), no embedded credentials and no sensitive query fragments. Allow `/toc/...` as a public-profile candidate after validation; categorically reject `/admin/application/...` irrespective of authentication status or content. Never test these internal routes for public access. Omit them from public exports and keep original values local only. Include tests with **fictional synthetic secrets only**.
5. Privacy CI checks must fail on (a) forbidden field names; (b) email-shaped strings in exported content that have not been separately approved; (c) suspicious credentials/token query parameters; (d) raw file names or original full-record dumps present in `dist`, `public`, or staged changes. **False positives** are manually adjudicated and documented, not silently suppressed.
6. Verify source-record **counts** using generated public-safe keys; do not print raw records in CI logs or assertion failure messages.
7. No user analytics trackers, cookies, third-party scripts, or web fonts telemetry beyond approved dependencies without documentation and explicit decision.
8. Review text labels, source links, search indexes, frontend bundles, static exports, downloadable CSVs, sourcemaps, deploy artifacts, screenshot fixtures, Git history and open PR diffs.
9. Add a visible public privacy/methodology note: observatory contains journal-level public information, with DOAJ account/contact data excluded.
10. Before first push, manually verify that staged files contain NO raw data or PII. A `.gitignore` file does not purge historical commits: if sensitive material was committed, stop and sanitize history before repository becomes public.

## Release approval checklist
- [ ] Permission for public reading acknowledged.
- [ ] Raw and private data remain local, gitignored, and absent from Git history.
- [ ] Public attribute inventory reviewed field by field.
- [ ] `Owner`, `Account Name`, `Account Email` absent everywhere public.
- [ ] `URL in DOAJ` exported/displayed only for safe public `/toc/...` journal profiles; **all** `/admin/application/...` values stay local and are completely excluded from public bundles, search, export and logs. Use separately validated public journal website fallback or omit.
- [ ] SINTA `Editor URL` allowed and shown only as validated public editorial-team link.
- [ ] Exports, frontend bundle, search index, charts, HTML source and logs scanned.
- [ ] PII, internal URL and secret-detection tests pass.
- [ ] Source-record counts reconciled without private payloads.
- [ ] Preview inspected on desktop and mobile, and independent attribution approved.
- [ ] User explicitly authorizes first public push and GitHub Pages deploy.

Any failed item blocks release. This is not permission to remove source rows: strip sensitive **columns/values** from the public representation while keeping source-row identity/counts.


## User-approved release with binding privacy gate
The user has authorized public GitHub/GitHub Pages delivery as the required outcome. This permission **does not** authorize personal DOAJ account data, raw CSV files or internal `/admin/application/` URLs to be published. Codex may execute push/deployment after the validated public allowlist and privacy tests pass. No repeated general publish approval is necessary; if a GitHub account action is required, request only that action.
