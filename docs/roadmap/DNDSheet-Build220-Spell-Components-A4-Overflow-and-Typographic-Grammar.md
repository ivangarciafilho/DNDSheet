# Build 220 — Spell Components, A4 Overflow Diagnostics, 2024 Glossary & Typographic Grammar

## Refreshed Source and Release Scope

Official base commit `95a6ab6` (`feat: Build 219 - Complete Tarrasque prose without losing mechanics`).
Build 220 advances the upstream default branch `build185-repairs` from Build 219 to Build 220, perfectly synchronizing with the production deployment at `https://ivangarciafilho.github.io/DNDSheet/#/`.

This release delivers 22 actionable engineering tasks grouped across 5 cohesive domains:
1. **Domain Engine: Number, Distance & Punctuation Grammar** (`src/core/domain/number-grammar.ts`, `test/core/NumberGrammar.test.ts`)
2. **WCAG Accessibility & 2024 Revised Rule Glossary** (`src/components/rendering/statblock-help.ts`, `test/core/StatblockHelp.test.ts`)
3. **High-Contrast Spell Components & School Contrast Tokens** (`src/css/statblock-grammar.scss`, `src/components/rendering/WebRenderer.vue`, `src/components/rendering/useProcessTokens.ts`)
4. **A4 Studio Live Page Overflow Diagnostics & Quick Layout Controls** (`src/stores/editor-store.ts`, `src/components/editor/A4LayerStudio.vue`, `src/components/rendering/WebRenderer.vue`)
5. **Typography & Trait Outcome Defensive Hygiene** (`src/components/rendering/useTextRenderer.ts`, `src/stores/monster-store.ts`)

---

## Acceptance Packet (22 Tasks Across 5 Domains)

### Domain 1: Domain Engine — Number, Distance & Punctuation Grammar
- **Task 1**: `formatDistanceUnit`: Canonical conversion of numeric distances (`10ft`, `60ft`, `0ft` -> `10 ft.`, `60 ft.`, `0 ft.`).
- **Task 2**: `formatMetricDistance`: Standard 5e metric equivalence conversion (`60 ft.` -> `60 ft. (18 m)`).
- **Task 3**: `cleanPunctuation`: Elimination of double punctuation (`.,`, `;,`, `:,`) with negative lookbehind preserving valid unit abbreviations like `ft.,`.
- **Task 4**: `cleanPunctuation`: Elimination of whitespace preceding colons (e.g. `On Success :` -> `On Success:`).
- **Task 5**: `cleanPunctuation`: Elimination of stray periods preceding opening parentheses (e.g. `14. (` -> `14 (`).
- **Task 6**: `cleanPunctuation`: Sanitization of double closing parentheses (e.g. `(14/+4, (16/+6, Acrobatics))` -> `(14/+4, 16/+6, Acrobatics)`).
- **Task 7**: `sanitizeProsePunctuation`: Composite high-order sanitizer pipeline combining distance formatting and punctuation cleanup.
- **Task 8**: Unit Test Suite: Complete test suite covering all edge cases in `test/core/NumberGrammar.test.ts` (10/10 green).

### Domain 2: WCAG Accessibility & 2024 Revised Rule Glossary
- **Task 9**: `bloodied` 2024 glossary rule term: tooltip definition explaining half hit points threshold ($\le 50\%$) and triggered tactical mechanics.
- **Task 10**: `temporary-hit-points` 2024 glossary rule term: tooltip definition explaining buffer behavior, non-stacking rules, and exhaustion order.
- **Task 11**: `disengage` 2024 glossary rule term: tooltip definition clarifying movement without provoking opportunity attacks.
- **Task 12**: `dodge` 2024 glossary rule term: tooltip definition detailing attack roll disadvantage and dexterity saving throw advantage.
- **Task 13**: `cover` 2024 glossary rule term: comprehensive tooltip definition covering half (+2 AC/Dex), three-quarters (+5 AC/Dex), and total cover.
- **Task 14**: Accessibility Unit Tests: Verification in `test/core/StatblockHelp.test.ts` asserting all 5 new 2024 terms exist with non-empty descriptions (5/5 green).

### Domain 3: High-Contrast Spell Components & School Badges
- **Task 15**: Theme Contrast Styles: Added `.dnd-spell-comp` and `.sb-qual.sb-comp` styling with rich violet (`#6a1b9a` on light, `#ce93d8` on dark) meeting WCAG AA 4.5:1 minimum contrast.
- **Task 16**: School Cell Emphasis: Added distinct italic styling for `.sb-qual.school-cell` with muted foreground tone.
- **Task 17**: Spell Tag Badging in `WebRenderer.vue`: Tagged all spell tag spans with `.dnd-spell-comp` across cantrips and spell levels 1-9.
- **Task 18**: Keyboard Interactive Tooltips: Bound `data-help="spell-components"` and `tabindex="0"` on `.sb-qual.sb-comp` in `useProcessTokens.ts`.

### Domain 4: A4 Studio Live Page Overflow Diagnostics & Quick Layout Controls
- **Task 19**: Reactive Page Measurement: Added `a4PageMeasuredHeight: 0` in `useEditorStore` and dynamic update listener in `WebRenderer.vue`.
- **Task 20**: Overflow Diagnostic Meter: Added live budget meter in `A4LayerStudio.vue` dynamically indicating `Optimal Capacity`, `Near Capacity`, or `Overflow (+X px)`.
- **Task 21**: 1-Click Layout Quick Controls: Added quick toggles in `A4LayerStudio.vue` for orientation, column split, compact density, and layout reset.

### Domain 5: Typography & Trait Outcome Defensive Hygiene
- **Task 22**: Defensive Slots Fallback & Senses Formatting: Standardized senses distance formatting to `60 ft.` and added defensive slot fallbacks (`monster.spellcasting?.slots || []`) across `useTextRenderer.ts` and `monster-store.ts`.

---

## Verification & Gate Certification

Per-build verification gate (`npm run gate`) passed all 10 checks completely:
1. `PASS core (0)`: 453 / 453 tests passing (100% green, +11 tests over Build 219).
2. `PASS lint (0)`: ESLint clean across `src` and `test`.
3. `PASS typecheck (0)`: Pinned baseline verified at exactly 613 diagnostics, 0 new diagnostics.
4. `PASS build (0)`: Quasar SPA production build clean.
5. `PASS fuzz (0)`: 57 / 57 headless Chrome UI fuzzing steps passing.
6. `PASS help (0)`: Glossary help tooltip smoke passing across 12 theme contrast probes.
7. `PASS spell (0)`: Spell plate browser smoke passing across 5 themes.
8. `PASS pages-build (0)`: GitHub Pages production build clean with `/DNDSheet/` base.
9. `PASS pages-assets`: Verified asset references and watercolor splash masks present.
10. `PASS pages-fuzz (0)`: 57 / 57 headless Chrome UI fuzzing steps passing on GitHub Pages build.
