# Metrics, ISSN Reconciliation and Visual Semantics

## Journal identity matching
**Primary mode: strict**
1. Prefer nonempty e-ISSN for each DOAJ record; compare to SINTA e-ISSN.
2. Only if DOAJ e-ISSN is missing, compare its p-ISSN to SINTA p-ISSN.
3. Do not match placeholder keys (`XXXX-XXXX`, partial X placeholders, etc.) merely because text is equal; retain them verbatim in data/display. A repeated placeholder is not evidence of journal identity.
4. If a key matches multiple distinct SINTA identities, mark `ambiguous`, do not arbitrarily select a rank.
5. Unique journal keys may be assembled from verified pairs of ISSNs and stable public journal identifiers; conflicts get collision flags and manual-review records. Deterministic priority and audit trail required.

**Extended mode:** may compare both ISSN media across both sources; identify separately (`cross_medium_match`) and exclude from strict headline metrics unless user explicitly switches modes. Detect and audit conflicts. No title-only fuzzy auto-merge; candidate discovery via title/URL must be review-only.

## Core units / denominator
| Metric | Numerator | Denominator / rule |
|---|---|---|
| Rejected records | count rows in fact_rejected_public | source rows within active filters |
| Withdrawn records | count rows in fact_withdrawn_public | source rows within filters |
| Distinct rejected journals | count unique unambiguous journal_id with >=1 rejected row | never count application records as journals |
| Repeat-record journals | count journal_id with >=2 rejected rows | denominator: all identifiable rejected journals in selected cohort |
| Repeat-date journals | count journal_id with >=2 different valid `event_day` | denominator: rejected journals with valid dates |
| Repeat-year journals | count journal_id with >=2 different years | denominator: rejected journals with valid years |
| Rejection gap | differences between consecutive parsed event timestamps/days per journal | define whether same-day rows are counted; exclude unknown dates |
| Matched rejected records | count rejected rows with unambiguous matching SINTA record | denominator: all rejected rows (including unmatched) |
| SINTA rejected-journal prevalence | distinct SINTA journal IDs with >=1 rejected record | distinct SINTA journals in that rank, snapshot 2026-11-15 |
| Rejected/Withdrawn/SINTA intersections | reconciled unique journal sets (not event rows) | same identity registry, exclude unresolved from asserted unique intersections |

Include `NA`, `unmatched`, `ambiguous` categories separately. A low count does not imply low rejection probability: the population of **all DOAJ applicants** is not present.

## Time semantics
- DOAJ covers recorded rejection and last withdrawal fields, not complete verified histories of every decision.
- A journal can have multiple source records at the same date/time: show row frequency and distinct event days separately. Avoid presenting a `Date Rejected` row as a verified independent application.
- In year trend charts, label 2026 **partial-year through source export** and do not compare as full calendar year without explicit annotation.
- No SINTA historical rank inference; every matched rank label must say **SINTA rank as of 15 Nov 2026**.
- No inference of rejection reason: source lacks an explicit rejection-reason field; no moral or integrity judgment.

## Visual requirements
- Venn: three journal sets `R`, `W`, `S`, all computed on the **same reconciled identity universe**. Show each of the 7 intersection regions and outside-S population/coverage clearly, with exact counts in accessible table. If incomplete identity means counts cannot be trusted, display an explicit coverage caveat or use UpSet with unresolved excluded; no fabricated area scaling.
- UpSet: exact set intersections, annotated units, same filters and definitions as Venn.
- Rejection recurrence histogram: 1,2,3,... N records per identified journal, plus distinct-date view, not a chart of names.
- Timeline: chronological record dates, same-day stacking and missing dates surfaced; do not fabricate timestamps.
- SINTA bar charts: both raw record counts and distinct-journal prevalence with denominators for S1–S6 and NA; no misleading shared axis for incompatible measures.
- Heatmaps: event year × SINTA rank (snapshot category), tooltip and text/table alternative.
- Every drill-down lists `source_record_id` and event fields without account PII.

## Required properties/invariants
- Counts at unfiltered state reconcile with source record counts (8,898 Rejected; 570 Withdrawn; 16,620 SINTA) unless source changes after explicit review.
- Every distinct source record belongs to exactly one public-safe source table.
- `unique_journals <= source_records` within the corresponding event population, excluding explicitly labeled unresolved.
- Rejected source-record frequency sum across reconciled+unresolved buckets equals total rejected records.
- Rank-specific unique SINTA counts summed across categories equal snapshot counts; ambiguous matches must not inflate the SINTA denominator.
- Intersection region totals reconcile to the journal universe included and to R/W/S marginal totals.
- KPI and chart counts always trace to same filtering and aggregation functions.
- Previous chat-computed values are **not fixtures**; independently recalculate from November snapshot and the unchanged original DOAJ files.

## Journal profile link provenance
DOAJ `URL in DOAJ` is a source attribute, not an ISSN identity key. Only validated public profile links may be displayed. `/toc/...` is a public-profile candidate; `/admin/application/...` is an internal route and must never appear in any public artifacts or logs. A link omitted pending review must not change journal/event counts, match flags, or metric denominators.
