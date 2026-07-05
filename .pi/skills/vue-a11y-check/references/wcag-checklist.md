# WCAG 2.1 AA Checklist for Vue Components

Quick reference for manual accessibility review of Vue SFC components.

## Principle 1: Perceivable

### 1.1 Text Alternatives
- [ ] 1.1.1 (A): All `<img>` have `alt` attribute (empty `alt=""` for decorative)
- [ ] 1.1.1 (A): SVG icons have `aria-label` or `<title>` (unless decorative)
- [ ] 1.1.1 (A): Material icons (`<span class="material-symbols">`) have `aria-hidden="true"` with a text alternative, OR `aria-label` on the parent button

### 1.2 Time-based Media
- [ ] 1.2.2 (A): `<video>` elements should reference captions via `<track>`
- [ ] 1.2.3 (A): Video has or links to a transcript
- [ ] 1.2.5 (AA): Audio description available for video

### 1.3 Adaptable
- [ ] 1.3.1 (A): Tables have proper `<th>` headers with `scope` attributes
- [ ] 1.3.1 (A): Form inputs have explicit `<label for="id">` or `aria-labelledby`
- [ ] 1.3.1 (A): Lists are marked up with `<ul>/<ol>/<li>`, not `div` + manual bullets
- [ ] 1.3.2 (A): Content maintains meaningful order when linearized

### 1.4 Distinguishable
- [ ] 1.4.1 (A): Color is not the sole means of conveying information (pair with icons, text, patterns)
- [ ] 1.4.3 (AA): Text contrast ratio ≥ 4.5:1 (normal) and ≥ 3:1 (large text ≥ 18px bold or ≥ 24px)
- [ ] 1.4.4 (AA): Text can resize to 200% without loss of content or functionality
- [ ] 1.4.5 (A): No images of text used where real text can be used
- [ ] 1.4.11 (AA): UI components and graphics have ≥ 3:1 contrast ratio

## Principle 2: Operable

### 2.1 Keyboard Accessible
- [ ] 2.1.1 (A): All functionality operable via keyboard (no mouse-only handlers)
- [ ] 2.1.2 (A): No keyboard traps — focus can move away from every component
- [ ] 2.1.4 (A): Single-character keyboard shortcuts can be remapped/disabled

### 2.2 Enough Time
- [ ] 2.2.1 (A): Moving/blinking/scrolling content can be paused (no auto-playing video without controls)
- [ ] 2.2.2 (A): Auto-updating content can be paused, stopped, or hidden

### 2.3 Seizures
- [ ] 2.3.1 (A): No content flashes more than 3 times per second

### 2.4 Navigable
- [ ] 2.4.1 (A): Skip navigation mechanism available (skip-to-content link)
- [ ] 2.4.2 (A): Page has descriptive `<title>`
- [ ] 2.4.3 (A): Focus order preserves meaning and operability
- [ ] 2.4.4 (A): Link/button purpose is clear from text or accessible name
- [ ] 2.4.6 (AA): Headings describe topic or purpose
- [ ] 2.4.7 (AA): Visible focus indicator on all interactive elements (`:focus-visible` styles)

### 2.5 Input Modalities
- [ ] 2.5.3 (A): Visible label text matches accessible name
- [ ] 2.5.5 (AAA recommended): Touch targets ≥ 44×44 CSS pixels

## Principle 3: Understandable

### 3.1 Readable
- [ ] 3.1.1 (A): Page language set (`lang` attribute on `<html>`)
- [ ] 3.1.2 (AA): Language of parts set (`lang` attribute on content in different language)

### 3.2 Predictable
- [ ] 3.2.1 (A): No unexpected context changes on focus (`@focus` should not navigate)
- [ ] 3.2.2 (A): No unexpected context changes on input change without warning
- [ ] 3.2.4 (AA): Consistent navigation and identification across pages

### 3.3 Input Assistance
- [ ] 3.3.1 (A): Input errors identified and described in text
- [ ] 3.3.2 (A): Labels or instructions provided for user input
- [ ] 3.3.3 (AA): Error suggestions provided when detected
- [ ] 3.3.4 (AA): Legal/financial/data-deletion submissions are reversible or confirmed

## Principle 4: Robust

### 4.1 Compatible
- [ ] 4.1.1 (A): Valid, well-formed HTML (no duplicate IDs, proper nesting)
- [ ] 4.1.2 (A): Custom components have correct name, role, and value
- [ ] 4.1.3 (AA): Status messages use `role="status"` or `aria-live` regions

## Vue-Specific Patterns to Check

### Component Accessibility
- Props: Accept `aria-label`, `aria-labelledby`, `aria-describedby` for consumers to pass through
- Slots: Named slots should have accessible alternatives
- Emits: Custom events shouldn't replace native keyboard behavior without fallback
- `v-if`/`v-show`: Toggled content should announce changes via `aria-live`

### Custom Widgets
- Sliders: Must have `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`
- Menus: Must have `role="menu"`, items with `role="menuitem"`, `aria-haspopup`, `aria-expanded`
- Tabs: Follow WAI-ARIA tab pattern (`role="tablist"`, `role="tab"`, `role="tabpanel"`)
- Dialogs/Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap, Esc to close

### Dynamic Content
- Loading states: Use `aria-live="polite"` or `role="status"`
- Errors: Use `role="alert"` or `aria-live="assertive"`
- Updates: Vue transitions should not trap focus or confuse screen readers