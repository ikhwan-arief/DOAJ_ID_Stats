# DOAJ × SINTA Journal Observatory

An independent, evidence-led observatory of Indonesian journals represented in DOAJ rejection and withdrawal records and the final SINTA snapshot dated 15 November 2026.

This is not an official DOAJ or SINTA service, and neither organization endorses it. The observatory reports source records and reconciled journal identities; it does not infer misconduct, rejection reasons, independent applications, current DOAJ status, or historical SINTA rank.

## Dashboard

The production site contains seven hash-routed pages:

1. Overview and exact Rejected/Withdrawn/SINTA intersections
2. Rejected Applications
3. Rejection History
4. Withdrawn Journals
5. SINTA Analysis
6. Journal Explorer
7. Data Quality and Methodology

The public interface includes record and journal grain controls, strict and extended ISSN views, year and SINTA-rank filters, search, exact UpSet/Venn partitions, journal drill-downs, and filtered CSV export.

## Data and analytical units

The release uses:

- 8,898 DOAJ rejected source records;
- 570 DOAJ withdrawn source records;
- 16,620 SINTA snapshot rows dated 15 November 2026.

Source records, distinct event days, event years, and reconciled journals are separate analytical units. SINTA rank labels always mean rank as of the snapshot date. Placeholder ISSNs remain verbatim but never establish journal identity by themselves.

Canonical reviewed public outputs are versioned under `data/public/v1/`. The frontend copy under `public/data/v1/` must remain byte-identical. `manifest_public.json` records schema, source structural hashes, ETL revision, and output hashes.

## Privacy boundary

The original CSV files are local-only under ignored `data/raw/`. They must never be committed, uploaded to Pages, or copied into frontend assets.

Public records are built from explicit allowlists. DOAJ personal account/contact columns and internal application links are excluded categorically. Only validated public DOAJ journal-profile links and separately validated journal websites are eligible for display. SINTA editorial-team URLs are treated as public links after URL-safety validation; no personal roster details are scraped.

Everything shipped to a static site is public. The release gate recursively scans canonical exports, frontend data, HTML, JavaScript, CSS, downloads, and staged files for prohibited fields, email-shaped content, internal routes, raw filenames, credential-like query parameters, private keys, and common token patterns.

## Local development

Requirements:

- Python 3.11 or later
- Node.js 22 or later
- npm

Install the locked frontend dependencies and start Vite:

```bash
npm ci
npm run dev
```

Type-check, test, and build:

```bash
npm run typecheck
npm test
npm run build
```

Run Python regressions and public-artifact validation:

```bash
python3 -m unittest discover -s tests -v
python3 scripts/verify_integration.py --skip-source-rebuild
python3 scripts/validate_public.py data/public public dist
```

With the three authorized source CSVs present locally in `data/raw/`, execute the stronger source-to-public reconciliation:

```bash
python3 scripts/verify_integration.py
```

To regenerate the versioned public outputs, pass the reviewed engine commit explicitly and then re-run all gates:

```bash
python3 scripts/build_public_data.py --etl-commit <reviewed-engine-commit>
```

Never regenerate or publish from an obsolete September SINTA file or an ISSN-cleaned derivative.

## Continuous integration and deployment

`.github/workflows/ci.yml` runs on pushes and pull requests. It rejects tracked private inputs, runs Python and frontend tests, reconciles public exports, type-checks, builds, scans the full artifact, and uploads the tested Pages artifact. A push to reviewed `main` deploys that exact artifact through GitHub Pages only after the verification job passes.

Vite uses relative asset paths and the application uses hash routing, allowing every dashboard route to load reliably from a GitHub Pages project site.

## Repository scope and licensing

Original application code is licensed under the MIT License; see `LICENSE`.

That code license does not grant rights over third-party source datasets, names, metadata, trademarks, or linked website content. Raw source CSVs are deliberately excluded. The committed derived tables are the reviewed, minimized public representation authorized for this observatory and remain subject to source attribution and applicable third-party terms.

Developed by Ikhwan Arief (`ikhwan[at]unand.ac.id`).
