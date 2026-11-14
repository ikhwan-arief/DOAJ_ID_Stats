# GitHub Repository, CI and Publication Procedure

## Hosting decisions
Use public GitHub repo with GitHub Pages and GitHub Actions, static Vite output. Use the authenticated owner/account and confirm any missing repository naming details as needed. For project Pages URL `https://<owner>.github.io/<repo>/`, configure Vite `base: '/<repo>/'`; for user Pages domain use appropriate root base. Prefer hash routing for reliable deep links on simple Pages hosting, or implement tested 404 fallback. External links open safely.

## Branch strategy
- `main`: tested stable source only.
- feature branches: `data/wp1-*`, `ui/wp2-*`, etc.
- CI on pull requests: ETL/metric tests, privacy scan, frontend lint/type/test/build, build artifact scan.
- Pages deployment from approved `main` after passed privacy and acceptance gates (the user has already authorized this public outcome); no CI task should implicitly publish just because a test passes.

## Publishable data strategy
Source CSV stays off Git and off Pages. The project may commit/version **reviewed public-safe derived tables** if user authorizes their contents, or deliver them through gated build artifact creation; either way scan static output recursively. Describe the tradeoff in README. A static site cannot secretly protect browser-delivered data: everything in `dist` is public.

## Before first commit/push
Create `.gitignore`, ensure no raw files staged, review `git status --short`, `git ls-files`, `git diff --cached --name-only`, and scan content of staged tracked files. If sensitive data ever entered repository history, removing it from HEAD is insufficient; stop and repair history before making public. Store secrets in GitHub Actions secrets only when truly needed; prefer no secrets.

## License / attribution
Choose and document a license for **original code**; do not assume the same license applies to redistributed source data. Add data provenance, authorization note as appropriate, snapshot dates, methodology, DOAJ/SINTA attribution and an independent-project disclaimer. Don't copy DOAJ logo or imply official affiliation.

## Release artifact inventory
- Public webpage (all seven routes)
- Public-safe structured journal/record data, aggregate charts, Venn/UpSet
- Methods and privacy note
- Source provenance/manifest
- Automated validation log with NO private data
- Version/tag and release notes

## Final manual checklist
- [ ] Source and data contracts reviewed
- [ ] Public allowlist reviewed by user
- [ ] Privacy checks pass on all tracked/staged/generated files
- [ ] Full test suite and browser smoke tests pass
- [ ] No unsupported claims about journal misconduct or DOAJ live status
- [ ] GitHub repo identity/visibility agreed
- [ ] User-authorized public push and successful Pages go-live after all gates pass

## DOAJ profile links
DOAJ `URL in DOAJ` may be publicly linked **only when its value is a safe public profile URL**, e.g. Withdrawn `/toc/...`. Rejected `/admin/application/...` routes are internal and **must never be published, tested for anonymous access, rendered, exported, logged, or included in build artifacts**. Use a separately validated public `Journal URL` when available and retain source originals only locally. All forbidden account fields remain blocked.


## Production go-live is required, not optional
The user explicitly directs delivery of a **live public GitHub Pages site**. Treat that as authorization to publish **after** all privacy, data, functionality, and accessibility gates pass; no second blanket approval is needed. No raw CSVs, DOAJ account data, or internal `/admin/application/` links may enter repository contents or history or site artifacts.

### WP7 mandatory execution sequence
1. Verify tests and inspect staged files, tracked files, repository history, public exports and generated bundle for sensitive records and forbidden URLs. Halt on any failures.
2. Confirm GitHub authentication, repository owner/name, and available GitHub Pages permission. If unavailable, identify the **one specific account action** required rather than claiming success.
3. Create/use the intended **public repository**, set the appropriate remote, push reviewed source code and approved public-safe dataset; never push raw source CSVs.
4. Configure Actions and GitHub Pages for Vite, including correct base path and SPA routing; trigger deployment and verify workflow success.
5. Visit the **actual deployed HTTPS URL** in a clean session and verify all seven pages, navigation/deep links, dataset loading, chart interactions, global filters, journal details, export downloads, responsive layout, and no internal/PII leakage. Test at least one journal record against a reproducible approved source key.
6. If live deployment or tests fail, fix, retest, and redeploy. If blocked by user-only account access, report precisely what is missing and mark `DEPLOYMENT BLOCKED`, not `DONE`.
7. Record live URL, repository URL, commit SHA, workflow run, results and remaining caveats in README and final handoff.

**Definition of done:** publicly accessible site confirmed operational; release-candidate or "ready to deploy" status is not completion.
