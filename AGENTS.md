# Agent Operating Agreement (Codex + Antigravity)

This file is the **single shared instruction** for both VS Code coding agents. Do not create independent conflicting plans. Keep existing VS Code agent configurations; these project-specific instructions take precedence for this repository only.

## Hard rules
- **No personal data in public artifacts.** Source DOAJ includes `Owner`, `Account Name`, `Account Email`. They are never exported, logged, indexed, cached, rendered, or committed. Do not display sample personal values in README, screenshots, fixture files, prompts, test snapshots, issues, or handoffs.
- Raw source CSV files stay in `data/raw/` and private intermediates in `data/private_work/`, both ignored by Git. Create `.gitignore` **before** starting. Test recursively against `dist/`, `public/`, `data/public/`, and staged Git files. Hard-fail on forbidden fields. Do not assume only these three columns can contain personal data: scan free text/URLs and enforce explicit public allowlists.
- DOAJ `URL in DOAJ` is a mixed-purpose source field. `https://doaj.org/toc/...` may be displayed as a public journal profile after safe URL validation. **Never publish, render, export, log, or attempt to validate public access to the `/admin/application/...` route: the user confirms this route is internal. No exceptions, even if a particular endpoint appears reachable.** For Rejected journals use a separately validated public `Journal URL` or omit the DOAJ profile link. Preserve internal source URLs locally only. SINTA `Editor URL` is a public editorial-team journal link and is permitted after safe URL checks.
- Preserve original rows, order, placeholder ISSNs (`XXXX-XXXX`, `0000-0XXX`, etc.), and both ISSN media. Do not fabricate corrections, missing values, application IDs, historical SINTA ratings, or reasons for rejection.
- `sinta_database_final_15112026.csv` is the only SINTA source. Reject usage of September or `...ISSN_cleaned.csv`.
- Distinguish source records, distinct event timestamps/dates, and reconciled unique journals. Never infer that repeat rows prove resubmitted applications.
- All seven pages use one metric contract and a shared filter engine. Every chart's aggregates must reconcile to underlying exported rows at the same filter state.
- Independent observatory, not an official DOAJ product; no unauthorized logo or endorsement wording. Use the supplied DOAJ palette and permitted typography, as specified.
- Run relevant tests before committing. Don't mark a task complete or invent passing test results.

## Agent ownership / token economy
- **Codex:** ETL, matching, deterministic journal registry, privacy/public-data builder, metric tests, CI/build/release, integration audits.
- **Antigravity:** React UI, accessible shared components, responsive layout, charts, journal explorer, cross-filter interaction, visual testing.
- Changes to shared contracts (`DATA_CONTRACT`, `METRICS_AND_MATCHING`, `PRIVACY_AND_PUBLICATION`, `DESIGN_PROTOCOL`) require explicit change note in `HANDOFF.md` and review by the other agent before implementation.
- One active agent at a time, one work-package/subtask at a time. Prefer smallest meaningful file and targeted tests. Use `git diff`, not broad re-reading or wholesale rewrites.
- Never run `git add .` blindly. Inspect staging and use explicit paths. Push is authorized for WP7 once privacy and acceptance gates pass; earlier WPs must not push.

## Standard task loop
1. Read `HANDOFF.md` and work package. Verify clean tree/last commit.
2. State exact files and acceptance criteria in your local note; implement only this slice.
3. Run tests and privacy checks relevant to slice; document commands and real outputs.
4. Commit with prefix `data:`, `ui:`, `test:`, `docs:`, `ci:` or `fix:`.
5. Update `HANDOFF.md`: completed, commit, tested, blockers, next action, open decisions, file list.
6. Stop; do not independently start the next agent's work.

## Stop-the-line triggers
Unexpected exposed PII, unsafe DOI/URL, incorrect unique-journal counts, cartesian joins, unsupported DOAJ status interpretations, or source row loss must block publishing and be documented. Keep the site undeployed until resolved.


## Final delivery mandate (user-approved)
The user explicitly requires a **fully functional, seven-page, publicly accessible GitHub Pages website**, not plans, prototypes, or a release candidate. All intermediate WP1–WP6 sessions stop at their assigned handoff **only**; they must not treat the project as finished. WP7 owns the live release, including public repository push, GitHub Pages configuration, deploy, live verification, and remediation of failed checks. The user has authorized final public release contingent on privacy validation; do not ask again for blanket deployment permission. Ask only for missing GitHub credentials/authorization, account choice, or repository name when these cannot be established safely. Never bypass privacy gates. `HANDOFF.md` must distinguish work-package completion from full project completion.
