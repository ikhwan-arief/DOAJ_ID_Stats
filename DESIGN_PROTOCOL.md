# Dashboard Design Protocol — DOAJ Palette, Independent Identity

**Binding visual reference:** `DOAJ-design-protocol-EN.md` (provided by user). Supplement: `DOAJ-design-protocol-ID.md`. The project adopts the palette and design principles but is **not an official DOAJ project**, and should not use DOAJ logo or official tagline to suggest endorsement. If a detail conflicts, the English protocol wins; accessibility requirements win over purely decorative choices.

## CSS token inventory (use variables, not new one-off hex values)
```css
:root {
  --warm-black: #282624;
  --dark-grey: #5C5956;
  --light-grey: #F6F4F4;
  --white: #FFFFFF;
  --sanguine: #982E0A;
  --grapefruit: #FD5A3B;
  --salmon: #FA9A87;
  --dark-green: #3A5959;
  --mid-green: #47A178;
  --light-green: #A3C386;
  --yellow: #F9D950;
  --neutral-border: #A9A7A5;
}
```
Allow alpha variants derived from the defined tokens for accessible lines/fills. No unrelated brand colors. Contrast-check *each text/background pair*, especially chart tooltip labels and yellow/salmon accents; do not assume a vivid color passes for text.

## Typography
- Spectral: page H1, large display headings, KPI numerals (`letter-spacing: -0.03em`).
- Source Sans Pro: body, UI, table, charts, controls (`letter-spacing: +0.015em`).
- Source Code Pro: ISSNs and technical identifiers.
- Base: protocol desktop 20px, mobile 18px, with compact data visualization styles but **never below 14px web text**. Use CSS rem units, semantic H1–H6, left-aligned paragraphs.

## Layout and components
- Light theme is the first release. Desktop ≥1280px, tablet 769–1279px, mobile ≤768px. The dashboard must work at 375px width, with table horizontal scroll and readable filter drawer.
- Spacing scale: 0.1875, 0.375, 0.75, 1.5, 3, 6rem. Radius 0.375rem standard / 0.1875rem compact. Min touch target 44×44px.
- Primary nav warm-black; primary text warm-black; white/light-grey sections; subtle borders and minimal shadows; no generic AI gradients, glassmorphism, rainbow dashboards or 3D charts.
- Use Feather-style icons where compatible. Functional icons have labels/tooltips; no icons solely for decoration when they clutter data.
- Card styles, alerts, buttons, stats and content patterns should reference the supplied protocol. Independent observatory title and clearly labeled provenance/disclaimer in footer.

## Semantic visualization tokens
- **Rejected:** `--sanguine` + explicit label/icon, never encode as misconduct.
- **Withdrawn:** `--dark-green` + explicit label. Do not present green as 'success' status.
- **Intersection/selection:** `--grapefruit` or pattern/outline with explicit text.
- **Other categories:** remaining DOAJ approved hues plus texture/symbol when color distinctions are insufficient. **All S1–S6 must be legible without color alone.**
- Charts should contain title, metric unit, temporal scope, distinct-source vs unique-journal definition, data/coverage note, accessible tabular alternative, and keyboard-reachable controls.
- Venn geometry must not imply proportional areas unless mathematically constructed to do so. Prefer UpSet for precise intersections. Provide counts in a real table; both draw from the same data.

## Accessibility / interaction
- Target WCAG 2.1 AA: contrast ≥4.5:1 for normal text, ≥3:1 for large text; visible focus indicator, full keyboard navigation, semantic tables, text alternatives for charts, meaningful link labels, accessible dialogs and filter state.
- Filter state reflected in UI and URL query string if feasible; Reset Filters always works. Distinguish `S1–S6`, `NA`, `unmatched`, `ambiguous`.
- Loading, empty, data unavailable, and error states must be understandable and accurate. No fake interactive controls.
- Tooltip should not be the only way to learn a value; offer accessible source tables with sort and CSV export.

## Writing/editorial style
- English; plain, precise and neutral. Avoid ranking journals morally, alleging ethics violations or claiming causality. Good wording: 'records of rejected applications' / 'matched to SINTA (snapshot 15 Nov 2026)'.
- The public footer must state 'Independent analytical project; not an official DOAJ service' and provide methodological/source context, without using official logo or tagline as implied endorsement.

## Review checklist
- [ ] All styling uses defined tokens, semantic typography and neutral editorial visual language.
- [ ] Chart categories convey meaning through labels/shape in addition to palette.
- [ ] Mobile/tablet/desktop and keyboard interactions tested.
- [ ] Minimum 14px type, accessible contrast, focus and tabular alternatives.
- [ ] Venn and UpSet use reconciled journal sets and exact counts.
- [ ] No official DOAJ endorsement suggested; public provenance/disclaimer visible.

## Public-source link presentation
On Journal Explorer, display an explicit **View DOAJ journal profile** link when a validated public `URL in DOAJ` is available; otherwise hide the action or use a separately verified public journal website link with accurately differentiated label. Never render `/admin/application/...` internal application routes, even when reachable; they are categorically prohibited from all public outputs. Use safe external-link attributes and descriptive text.
