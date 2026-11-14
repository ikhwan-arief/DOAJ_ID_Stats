# DOAJ × SINTA Journal Observatory — Start Here

**Status:** Planning package, not an implemented dashboard. **Working language:** English for all public UI, code documentation, and final public-facing copy. The user may communicate with the agents in Indonesian.

## Mission
Build an independent, evidence-led, publicly accessible seven-page observatory using DOAJ rejected applications (2022–2026), DOAJ withdrawn records (2022–2026), and the SINTA snapshot dated **15 November 2026**. Keep all source rows; never conflate records with independent applications, decisions, or unique journals. Use the DOAJ palette and design system without claiming the observatory is endorsed by DOAJ.

## Read order for both agents
1. `AGENTS.md` — immutable operating rules and ownership.
2. `MASTER_PLAN.md` — scope, architecture, releases.
3. `DATA_CONTRACT.md` and `METRICS_AND_MATCHING.md` — authoritative analytical meaning.
4. `PRIVACY_AND_PUBLICATION.md` — compulsory public data gate.
5. `DESIGN_PROTOCOL.md` plus `DOAJ-design-protocol-EN.md` — UI contract.
6. `WORK_PACKAGES.md`, `ACCEPTANCE_TESTS.md`, `HANDOFF.md` — work sequence and validation.

For a small scoped task, read only `AGENTS.md`, the task's relevant contract(s), and the latest `HANDOFF.md` after the initial reading.

## Input files (local only; NEVER commit)
- `ID_-_Rejected_applications_2026-11-14T22_08_29Z.csv` — 8,898 rows, 53 columns in inspected upload.
- `ID_-_Last_Withdrawn_2026-11-14T22_08_52Z.csv` — 570 rows, 59 columns.
- `sinta_database_final_15112026.csv` — 16,620 rows, 17 columns. **Supersedes** `sinta_database_final_15092026.csv`.

Put these in `data/raw/` locally. Never use the prior `...ISSN_cleaned.csv`, which incorrectly blanked allowed ISSN placeholders. Prior exploratory analytical numbers are provisional, not acceptance-test fixtures.

## Project layout to create
```text
project/
  AGENTS.md, MASTER_PLAN.md, DATA_CONTRACT.md, ...
  data/raw/                 # gitignored, original CSVs
  data/private_work/        # gitignored, any interim private analysis
  data/public/              # publishable, schema-validated output only
  scripts/                  # Python ETL and privacy validation
  tests/                    # unit, integration, privacy, metric tests
  src/                      # React + TypeScript frontend
  public/                   # static files; nothing sensitive
  .github/workflows/        # CI and gated Pages deploy
```

## How to start
1. Read the docs and confirm filenames/headers locally, without copying raw data into Git.
2. Run Codex WP1, validate and commit; hand off to Antigravity WP2; alternate in order.
3. No public push or Pages deployment until `PRIVACY_AND_PUBLICATION.md` release gate passes.
4. One agent edits the working tree at a time. Every handoff includes commit SHA and test outcomes.

**Public data permission:** The user confirms DOAJ data may be used for public reading. This does **not** permit exposing personal account fields or unverified privileged links. `URL in DOAJ` is a mixed-purpose source field: Rejected values use the internal `/admin/application/...` route and MUST NEVER enter any public artifact; Withdrawn values use `/toc/...` and may be displayed as public journal profiles after safe URL checks. `Editor URL` from SINTA is a public editorial-team page and is allowed after safe URL validation.

## Package revision: DOAJ source URL handling
Final user clarification: the `/admin/application/...` path is an internal DOAJ application route, not intended for public access. Block this route unconditionally in exports, downloads, logs, builds, and UI; do not attempt anonymous-access verification. `https://doaj.org/toc/...` is eligible as a public journal-profile link after normal safe URL validation. Account data remain strictly private.


## Mandatory outcome: live public site
This is an **end-to-end production delivery**, not a prototype or deployment preparation exercise. Completion requires all seven pages implemented with verified real, privacy-safe data; committed and pushed code to a **public GitHub repository**; GitHub Pages enabled; and a working public URL tested in a fresh browser session. The user has already authorized this final public outcome, subject to privacy/security gates. Do not request redundant general deployment approval. If GitHub authentication, repository owner/name, or a required account setting is missing, ask for only that blocking action, then continue to live verification. See `GITHUB_RELEASE.md` and `ACCEPTANCE_TESTS.md`.
