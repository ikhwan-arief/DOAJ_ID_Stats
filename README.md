# DOAJ × SINTA Journal Observatory

An independent, evidence-led observatory of Indonesian scholarly journals represented in DOAJ indexing, historical rejection and withdrawal records (2022–2026), and the national SINTA accreditation census (as of 15 November 2026).

This is not an official DOAJ or SINTA service, and neither organization endorses it. The observatory reports source records and reconciled journal identities; it does not infer misconduct, rejection reasons, or historical SINTA accreditation rank.

## Production Dashboard

The public observatory contains seven navigable analytical pages:

1. **Overview & Intersections**: High-level metrics, exact three-set Euler/Venn diagram, interactive UpSet matrix, and current DOAJ × SINTA two-set overlap.
2. **Rejected Applications**: Longitudinal monthly/yearly event trajectories, SINTA tier distributions, and year-by-rank intensity heatmap.
3. **Rejection History**: Recurrence distributions, consecutive application intervals, and top recurrent journal identities.
4. **Withdrawn Journals**: Annual withdrawal volumes, SINTA rank breakdown, and current indexing status indicators.
5. **SINTA Analysis**: Grouped comparative bars, current DOAJ coverage rates by tier (S1–S6), 100% stacked prevalence, and calendar year intensity heatmap.
6. **Journal Explorer**: Search-first journal dossier system (by Title, P-ISSN, E-ISSN, or Reconciled ID) with verified public profile links and event timeline.
7. **Data Quality & Methodology**: Source accounting, strict versus extended ISSN matching comparisons, and quality classification distributions.

The public interface features record and journal grain controls, strict and extended ISSN matching views, year and SINTA-rank filters, multi-attribute search, accessible table alternatives, and filtered CSV exports.

## Analytical Datasets

The observatory synthesizes four authoritative datasets:

- **DOAJ Historical Rejected Applications**: 8,898 records (2022–2026);
- **DOAJ Historical Withdrawn Journals**: 570 records (2022–2026);
- **DOAJ Current Indexed Journals (Indonesia)**: 2,733 records (snapshot: 15 November 2026);
- **SINTA National Accreditation Census**: 16,620 journals (snapshot: 15 November 2026).

Source records, distinct event dates, calendar years, and reconciled journal entities are maintained as separate analytical units. SINTA accreditation ranks represent status as of the snapshot date. Placeholder ISSNs (`XXXX-XXXX`, `0000-0XXX`) are preserved verbatim but never establish journal identity alone.

Canonical reviewed public outputs are versioned under `data/public/v1/`. The frontend copy under `public/data/v1/` remains byte-identical. `manifest_public.json` records schema versions, source structural hashes, ETL commit, and output file hashes.

## Privacy & Security Boundary

Original raw CSV files remain strictly local under `.gitignore` (`data/raw/`). They are never committed, uploaded to GitHub Pages, or serialized into frontend bundles.

Public outputs are constructed using strict allowlists. Personal DOAJ account fields and internal administration routes (`/admin/application/`) are excluded categorically. Only validated public DOAJ journal-profile URLs (`/toc/...`), public journal websites, and SINTA editorial-team links are permitted.

Automated privacy scans recursively inspect all canonical exports, frontend assets, HTML, JavaScript, CSS, downloads, and staged git files for sensitive patterns, email addresses, internal routes, raw filenames, and credentials.

## Development & Verification

### Prerequisites
- Python 3.11+
- Node.js 22+
- npm

### Installation & Local Run
```bash
npm ci
npm run dev
```

### Build & Test Suite
```bash
# Type check and build frontend
npm run typecheck
npm test
npm run build

# Python regression tests and public artifact validation
python3 -m unittest discover -s tests -v
python3 scripts/verify_integration.py --skip-source-rebuild
python3 scripts/validate_public.py data/public public dist
```

With authorized source CSV files present locally in `data/raw/`, run full source reconciliation:
```bash
python3 scripts/verify_integration.py
```

## Continuous Integration & Deployment

The repository uses GitHub Actions (`.github/workflows/ci.yml`). On pushes and pull requests to `main`, the workflow:
1. Rejects tracked private inputs or raw datasets;
2. Executes Python regressions and integration verifications;
3. Runs frontend tests and TypeScript checks;
4. Builds the production artifact and runs recursive privacy scans;
5. Automatically deploys to GitHub Pages on verified commits.

## Repository Scope & Licensing

Application source code is licensed under the MIT License; see `LICENSE`.

The code license does not grant rights over third-party source datasets, names, metadata, trademarks, or linked website content. Raw source CSV files are excluded. Derived public tables represent the reviewed, privacy-safe analytical extracts authorized for this observatory and remain subject to source attribution and applicable third-party terms.

Developed by Ikhwan Arief (`ikhwan[at]unand.ac.id`).
