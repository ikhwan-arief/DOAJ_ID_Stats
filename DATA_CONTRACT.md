# Data Contract and Source Provenance

## Mandatory inputs and headers
All source CSV bytes are read only from local, gitignored `data/raw/`. Store SHA-256, header lists, UTF-8 handling, source row count and ingest timestamp in a **public-safe manifest**. No personal values in manifest. Fail if required inputs are absent. Never change originals.

| Dataset | Filename | Expected rows | Expected columns | Grain |
|---|---|---:|---:|---|
| Rejected | `ID_-_Rejected_applications_2026-11-14T22_08_29Z.csv` | 8,898 | 53 | source rejection record |
| Withdrawn | `ID_-_Last_Withdrawn_2026-11-14T22_08_52Z.csv` | 570 | 59 | source withdrawal record |
| SINTA | `sinta_database_final_15112026.csv` | 16,620 | 17 | SINTA snapshot row |

These are inspected upload baselines, not an instruction to drop records when an authorized updated source has different counts. Changes require documented review. September SINTA is obsolete.

## Exact selected input columns
**DOAJ:** `Journal title`, `Journal URL`, `URL in DOAJ`, `Journal ISSN (print version)`, `Journal EISSN (online version)`, `Publisher`, `Country of publisher`, `Subjects`, `Date Rejected` (Rejected only), `Last Withdrawn Date`, `Last Reinstated Date`, `Date Applied` (Withdrawn only); other policy/attribute columns may be added only after allowlist review.

**SINTA:** `Journal Name`, `Sinta URL`, `P-ISSN`, `E-ISSN`, `Subject Area`, `Subject Area (Inferred)`, `Affiliation`, `Accreditation`, `Scopus Indexed`, `Garuda Indexed`, `Impact`, `H5-index`, `Citations 5yr`, `Citations`, `Google Scholar URL`, `Website URL`, `Editor URL`.

**Never export from DOAJ:** `Owner`, `Account Name`, `Account Email`. **`URL in DOAJ` is not universally publishable.** Source inspection: Withdrawn links use public journal-profile path `https://doaj.org/toc/...`; Rejected links use the internal `/admin/application/...` path. The user explicitly forbids publishing the internal route. Enforce a hard denylist regardless of reachability; no public access probing, URL export, frontend use, public error logs, or fallback to that route. Use separately validated public `Journal URL` for Rejected journals, if available. Retain internal URLs only in excluded local raw files. Personal identities in free text must also be screened. SINTA `Editor URL` is a public editorial team page and may be displayed after safe URL checks.

## Read/transform contracts
- `source_dataset`: `rejected | withdrawn | sinta`.
- `source_record_id`: deterministic `dataset + original_1_based_data_row_index` or stable content+occurrence key, stable for unchanged input. No email or identity strings in key.
- `p_issn_raw`, `e_issn_raw`: exact original string including placeholders, leading zeros and `X`.
- `p_issn_normalized`, `e_issn_normalized`: format normalization only when safely possible (trim whitespace, standardize hyphen); otherwise preserve source raw and tag anomaly. Do **not** blank placeholders or claim they are registered ISSNs.
- `preferred_issn`: e-ISSN if nonempty, else p-ISSN; source-specific. Empty and placeholder-only values cannot serve as a unique journal key without independent evidence.
- `issn_quality`: `checksum_valid | format_only | placeholder | invalid_format | missing | ambiguous`. Keep raw and quality distinct.
- `event_at`: parsed timestamp if present; preserve raw, timezone semantics, and precision; do not invent UTC offsets. `event_day`, `event_month`, `event_year` derive only from valid parsed dates.
- `sinta_rank`: `S1 | S2 | S3 | S4 | S5 | S6 | NA | unmatched`; retain exact raw accreditation value; document mapping.
- `subject_area`: direct vs inferred distinctly typed; inferred metadata is never passed off as verified classification.

## Output tables (proposed schema)
- `dim_journals_public`: `journal_id`, display title, both ISSNs, validated DOAJ public profile URL (`/toc/...` only, where present), other main public journal URLs, quality flags, identity method. Redact any private administrative links.
- `fact_rejected_public`: source record id, reconciled journal id if unambiguous, event timestamp/day, approved public attributes and match provenance.
- `fact_withdrawn_public`: source record id, reconciled journal id, last withdrawn date, last reinstated date, approved attributes.
- `sinta_snapshot_public`: source record id, journal id, 2026-11-15 SINTA rank, public attributes including Editor URL.
- `match_audit_public`: safe source record ids, match method, competing candidates count, status, **no raw private content**.
- `summary_public`: derived, unit-labeled reproducible aggregates.
- `manifest_public`: source names, source snapshot/export dates, hashes where appropriate, algorithm/schema version, record counts, known limitations.

## Referential and granularity requirements
- Source rows must remain fully represented in private processing and in public-safe event tables; never drop duplicate rows. Publish only approved fields from those rows.
- A journal may have many rejected records, withdrawals and SINTA source rows. Avoid cartesian amplification; never join raw event tables together on ISSN and then count rows.
- Any ambiguous identity gets an internal unique provisional key and `unresolved` label; do not merge unrelated journals sharing `XXXX-XXXX`.
- Dates: rejection date is `Date Rejected`; withdrawal date is `Last Withdrawn Date`; *reinstatement* is not a substitute for a current live DOAJ listing.
- URL safety: only http/https; reject javascript/data/file schemes and internal or credential-bearing hosts; escape any displayed text. External journal pages are untrusted content.

## Reproducibility
Keep a `schema_version` and exact ETL commit in manifest. Tests must compare public output counts to raw counts without exposing private fields. Any incompatible schema or changed grouping requires a reviewed migration and adjusted assertions.
