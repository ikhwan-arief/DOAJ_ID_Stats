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
