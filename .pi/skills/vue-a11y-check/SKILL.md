---
name: vue-a11y-check
description: Audit Vue single-file components (.vue) for WCAG 2.1 AA accessibility issues. Checks semantic HTML, ARIA attributes, keyboard navigation, color contrast, focus management, form labels, heading hierarchy, alt text, roles, aria-live regions, and i18n coverage. Use when reviewing Vue components for accessibility compliance, or when asked to check/review/audit/verify a component's accessibility or a11y.
---

# Vue Accessibility Checker

Audits Vue SFC files for WCAG 2.1 AA accessibility violations using automated pattern matching and manual review guidance.

## Quick Start

```bash
# Check a single component
.pi/skills/vue-a11y-check/scripts/check.sh vue/src/components/VideoPlayer.vue

# Check all Vue components in the project
find vue/src -name "*.vue" -exec .pi/skills/vue-a11y-check/scripts/check.sh {} \;

# Check and save a report
find vue/src -name "*.vue" -exec .pi/skills/vue-a11y-check/scripts/check.sh {} \; > a11y-report.txt
```

## Manual Review Guide

After running the automated scan, supplement with these manual checks:

### 1. Keyboard Navigation
- Can every interactive element be reached via Tab?
- Is the tab order logical (matches visual order)?
- Are there visible focus indicators on all interactive elements?
- Can all custom widgets (menus, sliders, dialogs) be operated with keyboard alone?
- Is there a "skip to main content" link if the page is large?

### 2. Screen Reader Testing
- Do all images have meaningful alt text or `alt=""` for decorative images?
- Are form inputs properly associated with labels (explicit `<label>` or `aria-labelledby`)?
- Do dynamic content updates use `aria-live` regions?
- Are error messages announced to screen readers?
- Is the page language set (`lang` attribute)?

### 3. Color & Contrast
- Does text meet 4.5:1 contrast ratio against its background?
- Is information conveyed by more than just color?
- Do focus indicators have sufficient contrast (3:1 minimum)?

### 4. Semantic Structure
- Is heading hierarchy correct (h1 → h2 → h3, no skipped levels)?
- Are landmarks used appropriately (`<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`)?
- Do lists use `<ul>/<ol>/<li>` instead of divs with manual bullets?

### 5. Forms & Interactive Elements
- Do all `<input>`, `<select>`, `<textarea>` have associated labels?
- Are buttons used for actions (not `<div onclick="...">`)?
- Do custom controls have appropriate ARIA roles, states, and properties?
- Are touch targets at least 44x44px for mobile?

### 6. Media
- Do videos have captions/subtitles available?
- Is there a transcript or audio description for video content?
- Can media players be operated via keyboard?

## Reference

See [references/wcag-checklist.md](references/wcag-checklist.md) for the full WCAG 2.1 AA criterion checklist with examples.

## Interpreting Results

The script outputs findings as:
- `[ERROR]` — Definite violation that must be fixed
- `[WARNING]` — Potential issue that needs manual review
- `[INFO]` — Informational note

## Integration with Moodle

Moodle requires WCAG 2.1 AA compliance. This plugin's components should meet:
- Perceivable: Content available to all senses
- Operable: All functions via keyboard
- Understandable: Clear, predictable UI
- Robust: Compatible with assistive technologies