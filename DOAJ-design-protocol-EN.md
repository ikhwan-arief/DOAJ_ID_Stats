# DOAJ Design & Materials Protocol

> Based on [DOAJ's Manuscript](https://doaj-kit.netlify.app/) — the official design system kit for DOAJ.org
> Design values sourced from DOAJ production CSS (`main.css v8.6.8`) and [Figma file CLkv5unlaRSU5YABUNqN1v](https://www.figma.com/file/CLkv5unlaRSU5YABUNqN1v)

---

DOAJ's Manuscript is an evolving document. It's the single source of truth for anyone creating or developing anything under the DOAJ name — from the website UI to PDF reports, presentation decks, e-mail headers, and social media assets.

Consistency, accessibility, and performance are at the core of everything we make.

---

## Contents

- [Overview](#overview)
- [Building blocks](#building-blocks)
  - [Logotype](#logotype)
  - [Tagline](#tagline)
  - [Colour palette](#colour-palette)
  - [Typography](#typography)
  - [Spacing system](#spacing-system)
  - [Icons](#icons)
  - [Layout & grid](#layout--grid)
- [Components](#components)
  - [Alerts](#alerts)
  - [Buttons](#buttons)
  - [Cards](#cards)
  - [Dropdowns](#dropdowns)
  - [Hero sections](#hero-sections)
  - [Labels](#labels)
  - [Pagination](#pagination)
  - [Portraits](#portraits)
  - [Search results](#search-results)
  - [Stats](#stats)
  - [Tags](#tags)
  - [Navigation](#navigation)
  - [Footer](#footer)
  - [Other structural elements](#other-structural-elements)
- [Content writing](#content-writing)
  - [General principles](#general-principles)
  - [Grammar, syntax, & typography rules](#grammar-syntax--typography-rules)
  - [Accessibility when creating content](#accessibility-when-creating-content)
- [Materials preparation](#materials-preparation)
- [Pre-publication checklist](#pre-publication-checklist)

---

## Overview

A design system is a living document in software and code. It's always up to date and new releases are immediately available to other products — a so-called "single source of truth". As well as including all brand attributes and interface components, a design system contains the principles, standards, and best practices to deliver a consistent user experience.

We build everything around three requirements:

- **Consistency** — the same experience, every time, everywhere
- **Accessibility** — usable by everyone, regardless of ability or context
- **Performance** — fast, lightweight, and technically sound

---

## Building blocks

### Logotype

The logotype files live in [Figma](https://www.figma.com/file/CLkv5unlaRSU5YABUNqN1v?node-id=1152:6). Always use the approved versions. Don't stretch, rotate, recolour, or add effects to the logo. Keep adequate clear space around it at all times.

The logo is available in **light mode** and **dark mode** variants. Use whichever ensures sufficient contrast against its background.

---

### Tagline

DOAJ uses the tagline **'Open. Global. Trusted.'** This appears in the site header and footer alongside the logo.

Where possible, it should also be used in:

- email signatures
- official documents
- letterheads

Don't translate the tagline. Don't change the word order. Always write it exactly as shown above, with capitalisation and full stops.

---

### Colour palette

DOAJ's colour system is defined in [Figma](https://www.figma.com/file/CLkv5unlaRSU5YABUNqN1v?node-id=42:45) and implemented as CSS custom properties. Only use these tokens — don't introduce colours outside the system.

#### CSS custom properties

```css
:root {
  --warm-black:   #282624;
  --dark-grey:    #5C5956;
  --light-grey:   #F6F4F4;
  --white:        #FFFFFF;
  --sanguine:     #982E0A;
  --grapefruit:   #FD5A3B;
  --salmon:       #FA9A87;
  --dark-green:   #3A5959;
  --mid-green:    #47A178;
  --light-green:  #A3C386;
  --yellow:       #F9D950;
}
```

#### Colour roles

| Token | Hex | Role |
| ----- | --- | ---- |
| `--warm-black` | `#282624` | Primary text colour; nav and footer background; dark button hover |
| `--dark-grey` | `#5C5956` | Secondary text; metadata; `<dt>` labels; disabled foregrounds |
| `--light-grey` | `#F6F4F4` | Page and section backgrounds; alert fills; card surfaces |
| `--white` | `#FFFFFF` | Content backgrounds; primary button base |
| `--sanguine` | `#982E0A` | Brand accent — primary buttons, labels, blockquote borders, error states |
| `--grapefruit` | `#FD5A3B` | CTA buttons; hover/focus/active states; danger alert border; nav link hover; footer link hover |
| `--salmon` | `#FA9A87` | Soft background accent |
| `--dark-green` | `#3A5959` | Success (`--alert--success` border); "Ready" status |
| `--mid-green` | `#47A178` | "Completed" status; success icon background |
| `--light-green` | `#A3C386` | "In progress" status; accent on dark backgrounds |
| `--yellow` | `#F9D950` | "Pending" / warning status |

#### Additional colour values in production use

| Hex / value | Usage |
| ----------- | ----- |
| `#A9A7A5` | Neutral mid-grey — borders in compact form fields and dashboards |
| `rgba(40, 38, 36, 0.25)` | Warm-black at 25% — card drop-shadows |
| `rgba(40, 38, 36, 0.45)` | Warm-black at 45% — overlays |
| `rgba(40, 38, 36, 0.65)` | Warm-black at 65% — search result subheadings |
| `rgba(40, 38, 36, 0.75)` | Warm-black at 75% — pagination default text |
| `rgba(92, 89, 86, 0.25)` | Dark-grey at 25% — table row dividers, `search-results__main` border |
| `rgba(92, 89, 86, 0.5)` | Dark-grey at 50% — `<hr>` dividers |
| `rgba(152, 46, 10, 0.25)` | Sanguine at 25% — portrait background tint |
| `rgba(253, 90, 59, 0.25)` | Grapefruit at 25% — validation error background |

#### Contrast reference

| Foreground | Background | Ratio | WCAG |
| ---------- | ---------- | ----- | ---- |
| `#282624` | `#FFFFFF` | ~17.5:1 | AAA |
| `#982E0A` | `#FFFFFF` | ~7.5:1 | AAA |
| `#5C5956` | `#FFFFFF` | ~7.0:1 | AAA |
| `#FD5A3B` | `#282624` | ~5.8:1 | AA |
| `#FFFFFF` | `#282624` | ~17.5:1 | AAA |
| `#282624` | `#F9D950` | ~12.0:1 | AAA |
| `#282624` | `#A3C386` | ~6.0:1 | AA |

Never use colour as the only way to convey meaning. Always back it up with text, an icon, or a symbol.

#### Status colours

| Status | Background | Text |
| ------ | ---------- | ---- |
| Pending | `#F9D950` | `#282624` |
| In progress | `#A3C386` | `#282624` |
| Completed | `#47A178` | `#282624` |
| Ready | `#3A5959` | `#FFFFFF` |
| On hold | `#F6F4F4` | `#282624` |

---

### Typography

Typography is defined in [Figma](https://www.figma.com/file/CLkv5unlaRSU5YABUNqN1v?node-id=60:9).

#### Typefaces

| Font | Classification | Use case | Letter-spacing |
| ---- | -------------- | -------- | -------------- |
| **Spectral** | Serif | H1, stat numbers, display headings | `-0.03em` |
| **Source Sans Pro** | Sans-serif | Body copy, navigation, labels, buttons, all UI | `+0.015em` |
| **Source Code Pro** | Monospace | Code blocks, technical strings | `normal` |

Google Fonts sources: [Spectral](https://fonts.google.com/specimen/Spectral) · [Source Sans Pro](https://fonts.google.com/specimen/Source+Sans+Pro) · [Source Code Pro](https://fonts.google.com/specimen/Source+Code+Pro)

#### Base font size

| Viewport | Base size |
| -------- | --------- |
| Desktop (`≥ 769px`) | `20px` |
| Mobile (`≤ 768px`) | `18px` |

All `em` values below are relative to this base.

#### Type scale

| Level | Selector | Size | Desktop px | Weight | Font |
| ----- | -------- | ---- | ---------- | ------ | ---- |
| 1 | H1 / `.type-01` | `1.802em` | ~36px | 700 | Spectral |
| 2 | H2 / `.type-02` | `1.602em` | ~32px | 400 | Source Sans Pro |
| 3 | H3 / `.type-03` | `1.424em` | ~28px | 400 | Source Sans Pro |
| 4 | H4 / `.type-04` | `1.266em` | ~25px | 400 | Source Sans Pro |
| 5 | H5 / `.type-05` | `1.125em` | ~22px | 400 | Source Sans Pro |
| 6 | H6 / `.type-06` | `0.889em` | ~18px | 400 | Source Sans Pro |
| — | Body | `1em` | 20px | 400 | Source Sans Pro |
| — | Small | `0.889em` | ~18px | — | — |
| — | Code | `0.889em` | ~18px | — | Source Code Pro |

#### Heading CSS

```css
h1 {
  font-size: 1.802em;
  font-family: 'Spectral', serif;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 1.5rem 0;
}

h2 { font-size: 1.602em; }
h3 { font-size: 1.424em; }
h4 { font-size: 1.266em; }
h5 { font-size: 1.125em; }
h6 { font-size: 0.889em; }

/* h2–h6 shared */
h2, h3, h4, h5, h6 {
  font-weight: 400;
  line-height: 1.05;
  margin: 1.5rem 0 0.75rem 0;
}
```

#### Body CSS

```css
body {
  font-family: 'Source Sans Pro', sans-serif;
  font-size: 20px;        /* 18px on mobile */
  font-weight: 400;
  line-height: 1.45;
  letter-spacing: 0.015em;
  color: #282624;
  background-color: #fff;
  -webkit-font-smoothing: antialiased;
}
```

#### Links

```css
a {
  color: #282624;
  text-decoration: underline;
  overflow-wrap: break-word;
}
a:hover, a:focus, a:active {
  color: #FD5A3B;
  text-decoration: none;
}
```

#### Code

```css
pre, code {
  font-family: 'Source Code Pro', monospace;
  letter-spacing: normal;
  font-size: 0.889em;
  background: #F6F4F4;
}
```

#### Typography rules

- Don't use text smaller than **11pt** in documents or **14px** on web.
- Avoid centre-justifying paragraphs — left-aligned text has standardised word spacing and is easier to read.
- Use heading styles (H1–H6) from the style menu, not manually bolded text.
- One H1 per page. Don't skip heading levels.

---

### Spacing system

DOAJ uses a consistent scale based on multiples of `0.375rem`.

| Token | Value | ~Desktop px |
| ----- | ----- | ----------- |
| 2XS | `0.1875rem` | 3.75px |
| XS | `0.375rem` | 7.5px |
| SM | `0.75rem` | 15px |
| MD | `1.5rem` | 30px |
| LG | `3rem` | 60px |
| XL | `6rem` | 120px |

#### Border radius

| Type | Value |
| ---- | ----- |
| Standard (cards, modals, forms) | `0.375rem` |
| Compact (compact cards, error lists) | `0.1875rem` |
| Circular (icon badges) | `50%` |

---

### Icons

Icon files live in [Figma](https://www.figma.com/file/CLkv5unlaRSU5YABUNqN1v?node-id=40:3). DOAJ's UI uses [Feather Icons](https://feathericons.com/) via `class="feather"`. Sizes are set relative to font context (e.g. `height: 0.75em` in buttons, `height: 1em` inline).

Only use icons from the approved library. Don't substitute from other sets without review.

Every interactive icon needs a visible label or tooltip. Interactive targets must be at least **44×44px**.

---

### Layout & grid

The layout system is in [Figma](https://www.figma.com/file/CLkv5unlaRSU5YABUNqN1v?node-id=439:53).

#### Breakpoints

| Name | Range | Behaviour |
| ---- | ----- | --------- |
| Mobile | `≤ 768px` | Single-column; base font 18px |
| Tablet | `769px – 1279px` | Adapted multi-column |
| Desktop | `≥ 1280px` | Full multi-column; base font 20px |

Don't create columns with the Tab key or Spacebar — screen readers don't understand visual column placement and will read text in the wrong order. Use proper column formatting: in Google Docs, Format → Columns; in CSS, use flexbox or grid.

---

## Components

All components have live demos in the [doajkit CodePen collection](https://codepen.io/doajkit). Use them before building something new.

---

### Alerts

```
class="alert"                  Base — light-grey bg, warm-black border
class="alert alert--message"   Message — dark bg, white text
class="alert alert--danger"    Danger/error — grapefruit border
class="alert alert--success"   Success — dark-green border
class="alert alert--info"      Info — dark-grey border
```

| Variant | Background | Border | Text colour |
| ------- | ---------- | ------ | ----------- |
| Base | `#F6F4F4` | `1px solid #282624` | `#282624` |
| `--message` | `#282624` | none | `#FFFFFF` |
| `--danger` | `#F6F4F4` | `2px solid #FD5A3B` | `#282624` |
| `--success` | `#F6F4F4` | `2px solid #3A5959` | `#282624` |
| `--info` | `#F6F4F4` | `2px solid #5C5956` | `#282624` |

```css
.alert {
  display: inline-block;
  padding: 0.75rem;
  margin: 0.375rem 0 0.75rem 0;
  background-color: #F6F4F4;
  border: 1px solid #282624;
  font-size: 0.889em;
}
```

Use `--danger` sparingly — only for actual errors.

---

### Buttons

```
class="button"                   Default
class="button button--primary"   Primary action
class="button button--secondary" Secondary action
class="button button--cta"       Call to action
```

#### Base button

```css
.button {
  padding: 0.375rem 0.75rem;
  border: 1px solid currentColor;
  background: transparent;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: smaller;         /* ~0.889em */
  transition: all 0.15s ease;
  cursor: pointer;
}
.button:hover, .button:focus, .button:active {
  background-color: #282624;
  border-color: #282624;
  color: #FFFFFF;
}
.button[disabled] {
  background-color: rgba(92, 89, 86, 0.15);
  border: 0;
  font-style: italic;
  cursor: not-allowed;
}
```

#### `--primary` button

```css
.button--primary {
  background-color: #FFFFFF;
  color: #982E0A;
  border-color: #982E0A;
  box-shadow: 0.1875rem 0.1875rem 0 0 #982E0A;
  position: relative; left: 0; top: 0;
}
.button--primary:hover, .button--primary:focus, .button--primary:active {
  left: 0.1875rem; top: 0.1875rem;   /* shifts into the shadow */
  box-shadow: none;
  background-color: #982E0A;
  color: #FFFFFF;
}
```

#### `--secondary` button

```css
.button--secondary {
  background-color: transparent;
  border-color: currentColor;
  box-shadow: 0.1875rem 0.1875rem 0 0 currentColor;
  position: relative; left: 0; top: 0;
}
.button--secondary:hover, .button--secondary:focus, .button--secondary:active {
  left: 0.1875rem; top: 0.1875rem;
  box-shadow: none;
}
```

#### `--cta` button

```css
.button--cta {
  background-color: #FD5A3B;
  border-color: #FD5A3B;
  color: #282624;
}
/* Hover retains the same fill */
```

---

### Cards

```
class="card"           Standard card
class="card--compact"  Compact card
```

```css
.card {
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  background-color: #FFFFFF;
  border-radius: 0.375rem;
  font-size: 0.889em;
  box-shadow: rgba(0,0,0,0.25) 0px 3px 8px;
}
.card--compact {
  margin-bottom: 1.5rem;
  border-radius: 0.1875rem;
  font-size: smaller;
}
.card__header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #5C5956;
}
.card__desc {
  color: #5C5956;
  margin-bottom: 0.1875rem;
}
```

---

### Dropdowns

```css
.dropdown__menu {
  background-color: #F6F4F4;
  border: 1px solid #282624;
  position: absolute;
  z-index: 1000;
}
.dropdown__trigger:hover,
.dropdown__trigger:active        { color: #FD5A3B; }

/* In primary nav — dark variant */
.primary-nav .dropdown__menu    { background-color: #282624; color: #FFFFFF; }
```

---

### Hero sections

```css
.hero                            { background-color: #F6F4F4; }
.hero header                     { padding: 1.5rem 0; }
.hero--aside                     { color: #282624; padding: 0.75rem; }
```

---

### Labels

```
class="label"                  Primary — sanguine, uppercase
class="label label--secondary" Secondary — warm-black
class="label label--tertiary"  Tertiary — dark-grey, not uppercase
class="label label--underlined" With bottom border
class="label label--large"     Large variant
```

```css
.label {
  display: block;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: smaller;          /* ~0.889em */
  line-height: 1.15;
  color: #982E0A;
  margin-bottom: 0.375rem;
}
.label a                         { color: #982E0A; text-decoration: none; }
.label--secondary                { color: #282624; }
.label--secondary a              { color: #282624; }
.label--tertiary                 { color: #5C5956; text-transform: none; }
.label--underlined               { margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid; }
.label--large                    { color: #282624; font-size: 1.266em; margin: 0.1875rem 0 0.375rem; }
```

---

### Pagination

```css
.pagination {
  text-align: center;
  color: rgba(40, 38, 36, 0.75);
  font-style: italic;
  font-size: 0.889em;
}
.pagination strong               { color: #282624; font-style: normal; }
.pagination a                    { color: #982E0A; font-weight: 600; font-style: normal; text-decoration: none; }
```

---

### Portraits

Portraits use an offset-border treatment to create visual depth.

```css
.portrait {
  position: relative;
  background-color: rgba(152, 46, 10, 0.25);   /* sanguine 25% */
  border: 1px solid #982E0A;
  width: 100%;
  margin: 0.375rem 0 1.5rem;
}
.portrait__bg-img {
  position: relative;
  background-color: #982E0A;
  color: #FFFFFF;
  border: 1px solid #982E0A;
  /* Offset: 3px right, 3px down */
  top: 0.375rem;
  bottom: -0.375rem;
  right: -0.375rem;
  left: 0.375rem;
  background-size: cover;
  background-position: center;
}
.portrait__img                   { mix-blend-mode: multiply; }
.portrait--small                 { width: 50%; }
.portrait--small .portrait__bg-img { height: 6rem; }
```

---

### Search results

```css
.search-results                  { font-size: 20px; }   /* 18px mobile */
.search-results__record          { padding: 1.5rem; margin-bottom: 1.5rem; display: block; }

.search-results__heading         { font-weight: 600; font-size: 1em; line-height: 1.45; }
.search-results__heading a:hover,
.search-results__heading a:focus { color: #FD5A3B; }
.search-results__heading a       { text-decoration: none; }

.search-results__subheading      { color: rgba(40, 38, 36, 0.65); font-weight: 400; }
.search-results__main            { border-right: 1px solid rgba(92, 89, 86, 0.25); }
```

---

### Stats

Stats display key metrics prominently — typically used on the homepage and report pages.

```css
.stat                            { border-left: 1px solid #FD5A3B; }
.stat:first-of-type              { border-left: 0; }
.stat a                          { display: block; text-decoration: none; }

.stat__number {
  display: block;
  font-family: 'Spectral', serif;
  font-weight: 600;
  font-size: 1.424em;
  letter-spacing: -0.03em;
}
.stat__description {
  display: block;
  text-transform: uppercase;
  line-height: 1.35;
  font-size: 0.889em;
}
```

On dark backgrounds, stat and button accent colours shift to `--light-green` (`#A3C386`).

---

### Tags

```css
.tags                            { padding-left: 0; margin: 0 0 0.75rem; list-style: none; }
.tags li                         { display: inline-block; }
.tag                             { margin: 0 0.375rem; }
```

---

### Navigation

#### Primary navigation (site header)

Fixed to the top of every page.

```css
.primary-nav {
  position: fixed;
  top: 0;
  width: 100vw;
  z-index: 3000;
  height: 90px;
  background-color: #282624;
  color: #FFFFFF;
  text-transform: uppercase;
  font-weight: 600;
  transition: height 0.3s ease-out;
}
.primary-nav--scrolled           { height: 40px; }
.primary-nav a                   { color: #FFFFFF; }
.dropdown__trigger:hover         { color: #FD5A3B; }
```

#### Page navigation (in-page anchor links)

```css
.page-nav {
  margin: 1.5rem 0;
  padding-left: 0.75rem;
  border-left: 1px solid #FD5A3B;
  font-size: 0.889em;
  width: 264px;           /* 330px on large desktop */
}
.page-nav__heading {
  font-size: 1em;
  text-transform: uppercase;
  font-family: 'Source Sans Pro', sans-serif;
  letter-spacing: 0.015em;
}
```

---

### Footer

```css
.page-footer {
  background-color: #282624;
  color: #FFFFFF;
  font-size: 0.889em;
}
.page-footer h2 {
  text-transform: uppercase;
  font-size: 1em;
  font-family: 'Source Sans Pro', sans-serif;
  letter-spacing: 0.015em;
}
.page-footer a                   { color: #FFFFFF; text-decoration: none; line-height: 1.5; }
.page-footer a:hover,
.page-footer a:focus,
.page-footer a:active            { color: #FD5A3B; }
```

---

### Other structural elements

```css
/* Blockquote */
blockquote {
  padding-left: 1.5em;
  border-left: 1px solid #982E0A;
  font-style: italic;
}

/* Horizontal rule */
hr {
  margin: 3rem 0;
  border: 0;
  height: 1px;
  background-color: rgba(92, 89, 86, 0.5);
}

/* Definition lists */
dl dt                            { color: #5C5956; font-size: 0.889em; }

/* Tables */
table thead, table th            { text-align: left; color: #5C5956; font-weight: 400; font-size: 0.889em; }
table tr                         { border-bottom: 1px solid rgba(92, 89, 86, 0.25); }
table tr:last-child              { border: 0; }
table th, table td               { vertical-align: top; }

/* Background utilities */
.bg-black                        { background-color: #282624; color: #FFFFFF; }
.bg-grey                         { background-color: #5C5956; color: #FFFFFF; }
.bg-white                        { background-color: #FFFFFF; color: #282624; }
```

---

## Content writing

### General principles

Everything we write reflects three core qualities.

**Reliable**
We're comprehensive, of quality, trustworthy, useful, rigorous, and unique. When we publish something, people can count on it.

**Honest**
We're grassroots, relatable, understated, sustainable, open, and transparent. We don't oversell what we are.

**Far-reaching**
We're global and local, impactful, striving to be inclusive, international, multilingual, community-driven, and visible.

---

### Grammar, syntax, & typography rules

1. Use contractions as much as possible. It keeps a casual tone.
2. Stick to three or four sentences per paragraph.
3. Use the Oxford comma for lists of three or more items.

We recommend the [Grammarly](https://app.grammarly.com/) browser extension for spellchecking, grammar, and tone.

---

### Accessibility when creating content

#### Images

- **Informative images** — must have alt-text. Describe the content and function. Start with a capital letter, end with a full stop. Don't start with "Image of…"
- **Decorative images** — no alt-text needed (`alt=""`).

#### Sections

Use heading styles from the editor dropdown — don't manually bold text to simulate headings. This enables screen reader navigation.

#### Hyperlinks

Avoid 'here', 'click here', 'link'. Use descriptive link text that makes sense out of context.

- ❌ 'Click here for more information.'
- ✅ 'There are other examples of open access journals.' (link on the descriptive phrase)

#### Tables

Tables should only be used to present data — not for layout. For simple lists of data, use a list instead.

#### Columns

Don't create columns with the Tab key or Spacebar. Screen readers will read across columns incorrectly. Use: Format → Columns in Google Docs.

#### Lists

- **Numbered list** — when order matters (steps, procedures)
- **Bulleted list** — for items with no specific order

#### Colour and contrast

- Minimum contrast: **4.5:1** normal text, **3:1** large text (WCAG 2.1 AA)
- Check at [accessibleweb.com/color-contrast-checker](https://accessibleweb.com/color-contrast-checker/)
- Never use colour as the only means of conveying meaning

#### Text style

- Avoid centre-justifying paragraphs — use left-aligned text
- Don't use text 10pt or smaller; use 11pt or larger in documents

#### Navigation landmarks

Include page numbers in long documents: Insert → Page Number in Google Docs.

#### Recommended tools

- **Microsoft Word** — built-in accessibility checker
- **Adobe Acrobat** — built-in accessibility checker (for converting Docs to PDF)
- **WCAG Color Contrast Checker** — verify colour ratios

*Notes from the [Library Publishing Coalition](https://docs.google.com/presentation/d/1B2oIn9fksjEATMniwsXfC9ejbAE8E5hh1_6FqVu7WSQ/edit?usp=sharing).*

---

## Materials preparation

### Web & UI

- Use components from the DOAJ Figma library and CodePen collection.
- Reference CSS tokens (`--warm-black`, `--sanguine`, etc.) — don't hardcode raw hex values.
- All images need appropriate alt-text.
- All links need descriptive text.
- Colour contrast verified (WCAG 2.1 AA).
- Layout tested across mobile (≤768px), tablet (769–1279px), desktop (≥1280px).
- Components tested with keyboard navigation.
- Tested with a screen reader before launch.

### PDF reports

- Logo from Figma — vector format (SVG or EPS).
- Tagline 'Open. Global. Trusted.' where appropriate.
- Body font: **Source Sans Pro**, minimum **11pt**.
- Display/heading font: **Spectral** (or Source Sans Pro if Spectral unavailable).
- Body text left-aligned.
- Colour contrast verified before export.
- Accessibility checker run (Word or Adobe).
- Page numbers included.
- PDF metadata filled in (title, author, language).
- Informative images have alt-text.

### Presentation decks

- Approved logo and colour palette used.
- Charts and graphs have text descriptions — don't encode meaning in colour alone.
- Text legible at normal viewing distance.
- Saved as PPTX or PDF.

### E-mail signatures & letterheads

Every official email signature must include:

- Name and role
- Tagline 'Open. Global. Trusted.'
- DOAJ logo (email-appropriate version)
- doaj.org

Letterheads: logo, tagline, full organisation details. Multi-page documents need page numbers.

### Social media assets

*Full guidance is coming. In the meantime:*

- Use the approved logo and colour palette.
- Text on images must pass contrast checks.
- Don't encode meaning in colour alone.
- Size images correctly for each platform.
- Keep the visual style understated — consistent with DOAJ's honest, non-promotional brand voice.

---

## Pre-publication checklist

### Brand

- [ ] Logo is the approved, unmodified version from Figma
- [ ] Tagline 'Open. Global. Trusted.' is present where applicable
- [ ] Colours come from the approved CSS tokens / Figma swatches only
- [ ] Fonts: Spectral for display, Source Sans Pro for UI/body, Source Code Pro for code

### Typography

- [ ] H1 uses Spectral, weight 700, letter-spacing -0.03em, line-height 1.05
- [ ] Body uses Source Sans Pro, weight 400, line-height 1.45, letter-spacing +0.015em
- [ ] Text is 11pt or larger (documents) / minimum 14px (web)
- [ ] Body copy is left-aligned, not centre-justified
- [ ] Heading levels are correct and sequential — no skipped levels

### Colour

- [ ] All colours from the approved palette
- [ ] Colour contrast verified: ≥4.5:1 normal text, ≥3:1 large text
- [ ] Colour is not the only means of conveying meaning

### Writing

- [ ] Tone is professional but approachable — not stiff, not over-the-top
- [ ] Paragraphs are three to four sentences maximum
- [ ] Oxford comma used in all lists of three or more items
- [ ] Links have descriptive text
- [ ] Content reflects DOAJ's values: reliable, honest, far-reaching

### Accessibility

- [ ] Informative images have alt-text
- [ ] Tables are for data only, not layout
- [ ] Columns use proper column formatting
- [ ] Heading styles applied via style menu
- [ ] Long documents include page numbers
- [ ] Accessibility checker run (Word or Adobe for documents, Lighthouse for web)

### Technical

- [ ] File saved in the correct accessible format
- [ ] File metadata filled in (title, author, language)
- [ ] Images optimised for file size
- [ ] For web: Lighthouse audit passed

---

*Based on [DOAJ's Manuscript](https://doaj-kit.netlify.app/) and production CSS from [doaj.org](https://doaj.org) (main.css v8.6.8). The Manuscript is an evolving document — check it regularly for updates.*
