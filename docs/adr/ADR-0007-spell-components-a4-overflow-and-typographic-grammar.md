# ADR-0007: Spell Component Badges, A4 Print Capacity Diagnostics, and Typographic Grammar Normalization

## Status
Accepted - Delivered in Build 187 (2026-11-09)

## Context
Following visual audit of rendered statblocks and A4 print composition workflows, four distinct areas of refinement were identified:
1. **Spell Component & School Badge Highlighting**:
   - In unified spell tables and cellular action/trait plates (`buildPlateEntry`), spell components `(V, S, M, C, R)` and spell schools were rendered with standard text or subdued coloring.
   - For rapid in-combat tactical assessment and WCAG AAA readability, spell components require high-contrast, semantic badge styling (`.dnd-spell-comp`, `.sb-qual.sb-comp`) utilizing rich violet/purple (`#6a1b9a` on light themes, `#ce93d8` on dark themes).
2. **A4 Composition Studio Page Overflow Diagnostics & Live HUD**:
   - In the A4 Layer Studio and WebRenderer toolbar, creators designing A4 print sheets had no real-time visual indicator of their remaining vertical page capacity or overflow.
   - Users needed immediate feedback on page capacity budget (`Optimal`, `Near Capacity`, `Overflow (+X px)`), live height measurement in pixels, 1-click orientation toggling (`Portrait` $\leftrightarrow$ `Landscape`), 1-click column switcher (`1 Col` $\leftrightarrow$ `2 Col`), and compact density toggle to quickly resolve overflows before printing.
3. **WCAG Accessibility & Rule Glossary Expansion**:
   - The interactive statblock help tooltip system (`statblock-help.ts`) needed expansion to support revised 2024 D&D 5e core rules: `bloodied`, `temporary-hit-points`, `disengage`, `dodge`, and `cover`.
4. **Distance & Punctuation Hygiene in Senses and Trait Actions**:
   - Distance units in senses and outcomes exhibited spacing inconsistencies (`60ft` instead of `60 ft.`).
   - Trigger outcomes occasionally showed spaces before colons (`On Success :` instead of `On Success:`).
   - AC parenthetical riders sometimes retained a trailing period before the opening parenthesis (`AC: 14. (19...`).

## Decision
1. **Domain Engine: Number & Distance Grammar (`src/core/domain/number-grammar.ts`)**:
   - Added `formatDistanceUnit(text)`: normalizes distance notations (e.g. `10ft`, `60ft`, `0ft`) into standard canonical 5e spacing with terminal dot (`10 ft.`, `60 ft.`, `0 ft.`).
   - Added `formatMetricDistance(feet)`: converts 5e distances into standard metric equivalents (e.g. `60 ft. (18 m)`).
   - Added `sanitizeProsePunctuation(text)`: integrates distance formatting and punctuation normalization into a single robust pass.
   - Updated `cleanPunctuation(text)` to strip stray periods immediately preceding opening parentheses (`AC: 14. (` -> `AC: 14 (`).
   - Expanded unit tests in `test/core/NumberGrammar.test.ts` to 10/10 passing tests.
2. **WCAG Accessibility & 2024 Rule Glossary Expansion (`src/components/rendering/statblock-help.ts`)**:
   - Added 5 new authoritative glossary definitions: `bloodied`, `temporary-hit-points`, `disengage`, `dodge`, and `cover`.
   - Added dedicated unit test suite in `test/core/StatblockHelp.test.ts` (5/5 passing tests).
3. **Spell Component & School Plate Highlighting (`src/css/statblock-grammar.scss`, `WebRenderer.vue`, `useProcessTokens.ts`)**:
   - Styled `.spell-tag-badge`, `.dnd-spell-comp`, and `.sb-qual.sb-comp` with rich violet/purple (`#6a1b9a` on light, `#ce93d8` on dark).
   - Upgraded `buildPlateEntry` in `useProcessTokens.ts` to surface school and spell components as distinct high-contrast header cells matching visual requirements.
   - Tagged inline spell items in `WebRenderer.vue` with `.dnd-spell-comp`.
4. **A4 Studio Page Budget & Live Print Diagnostics HUD (`src/stores/editor-store.ts`, `A4LayerStudio.vue`, `WebRenderer.vue`)**:
   - Added `a4PageMeasuredHeight: 0` to `useEditorStore`.
   - Bound reactive height tracking and live budget meter to `WebRenderer.vue` toolbar and `A4LayerStudio.vue`.
   - Added 1-click layout controls in `A4LayerStudio.vue` (`Orientation`, `Columns`, `Compact Density`, `Reset Layout`).
5. **Defensive Spellcasting & Slots Robustness (`useTextRenderer.ts`, `monster-store.ts`)**:
   - Added safe fallbacks `monster.spellcasting?.slots || []` ensuring missing or partial spellcasting configurations never throw during rendering.

## Consequences
- **Positive**:
  - Distinct, high-contrast violet badges for spell components `(V, S, M, C, R)` and distinct school cells across all plate and spell table surfaces.
  - Real-time A4 capacity diagnostics HUD showing exact pixel overflow or remaining budget with 1-click quick-fix controls.
  - Comprehensive 2024 glossary coverage with full keyboard accessibility (`tabindex="0"`, `data-help="..."`).
  - 100% green verification: 383/383 core unit tests (+6 new tests over Build 186), 50/50 live browser CDP fuzz steps passing with 0 runtime exceptions.
  - Clean Quasar production build (exit code 0).
- **Negative / Trade-offs**:
  - None identified.
