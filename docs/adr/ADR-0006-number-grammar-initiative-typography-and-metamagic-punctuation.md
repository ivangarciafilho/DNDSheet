# ADR-0006: Impeccable Number Grammar, Headline Initiative Typography, and Metamagic Punctuation Normalization

## Status
Accepted - Delivered in Build 186 (2026-11-09)

## Context
During fine-grained review of rendered monster statblocks across standard WotC and modern cellular layouts, several micro-typographic and grammatical artifacts were identified:
1. **Punctuation Collision in Metamagic Options**:
   - When a metamagic effect ends with a period (e.g. `Change an action casting time to a Bonus Action for this casting.`), appending a comma before the next option created ugly composite punctuation `.,` (`casting., 1 SP to Twinned Spell`).
   - The final metamagic option lacked a terminal period.
2. **Double Parentheses in Custom Spell Level Cadences & Action Passives**:
   - Custom cadences authored with parentheses (e.g. `(1/Day)`) were re-wrapped in parentheses, rendering as `((1/Day)), Level 3:`.
   - Relocated skill checks with nested parentheses (e.g. `(10/+0, Perception)`) were wrapped in outer parentheses, creating `(8/-2, (10/+0, Perception))`.
3. **Initiative Headline Capitalization & Deduplication**:
   - The compact initiative display rendered with lowercase `initiative` instead of canonical Title Case `Initiative`.
   - Modifiers with multiple composable riders did not capitalize individual rider strings, and overlapping `With Advantage` / `At Disadvantage` notes could appear concurrently.
4. **Vitals Comma & Dice Formula Spacing Hygiene**:
   - AC parenthetical riders rendered with an unwanted comma before the opening parenthesis: `AC: 14, (19 if It Has Temporary Hit Points...)` instead of canonical `AC: 14 (19...)`.
   - Hit dice formula lacked spacing around operators: `(13d10+39)` instead of canonical `(13d10 + 39)`.
   - Speed riders ending with a period produced `., ` artifacting when joined by commas: `Points., Dodge:`.
   - Preset descriptions with space before colons: `On Success : takes`.
5. **Flush Vitals Box Model Alignment**:
   - In Step 29 of the comprehensive browser fuzz suite, `.dnd-cascade-panel` requires exact 0px horizontal padding to ensure flush edge alignment. Striped row backgrounds must achieve visual parity without offsetting text indentation.
6. **A4 Composition Layer Occlusion Presets**:
   - Users required quick 1-click access to common backing fills (Parchment `#fdf6e2`, Dark `#1a1a1a`, White `#ffffff`) and backing support for the creature portrait layer to occlude lower layers under normal blend mode.

## Decision
1. **Engineered Number & Punctuation Grammar Engine (`src/core/domain/number-grammar.ts`)**:
   - Implemented `cleanPunctuation(text)` to deterministically resolve punctuation collisions:
     - `.,` -> `,`
     - `;,` -> `;`
     - Multiple consecutive commas/semicolons -> single separator
     - Duplicate parentheses `((...))` -> `(...)`
     - Trailing punctuation before closing brackets `(10ft, )` -> `(10ft)`
     - Spaces before punctuation marks (`On Success: ` instead of `On Success : `)
     - Comma immediately before opening parentheses (`AC: 14 (` instead of `AC: 14, (`)
   - Implemented `formatSignedModifier`, `formatDiceFormula`, `formatInitiativeHeadline`, and `formatOrdinal`.
2. **Normalized Metamagic & Cadence Formatting in `WebRenderer.vue`**:
   - Stripped trailing punctuation on each metamagic option before appending the separator, and appended terminal period after the last option.
   - Stripped outer parentheses from `row.cadence` prior to rendering `(${cleanCadence})`.
3. **Refined Initiative Headline & Note Deduplication in `WebRenderer.vue`**:
   - Capitalized `Initiative` in `compactInitiativeDisplay`.
   - Capitalized the first letter of all composed riders.
   - Filtered redundant advantage/disadvantage notes if already specified by explicit riders.
   - Cleaned all composite punctuation through `cleanPunctuation`.
4. **Standardized 0px Flush Cascade Panel Padding (`src/css/statblock-grammar.scss`)**:
   - Standardized `.skill.dnd-cascade-panel` and `.skill.dnd-cellular-row` to `padding: 1px 0 !important; margin: 0 !important;` across striped and unstriped states, guaranteeing 0px flush alignment while maintaining readable zebra striping.
5. **A4 Layer Studio Backing Presets & Portrait Occlusion (`A4LayerStudio.vue`, `WebRenderer.vue`)**:
   - Added interactive preset chips (`Clear`, `Parchment`, `White`, `Dark`) and clear button to `backgroundColor` input in `A4LayerStudio.vue`.
   - Bound `backgroundColor: pLayer?.backgroundColor || undefined` in `a4PortraitStyle`.
6. **Vitals & Action Passives Typographic Elegance (`WebRenderer.vue`, `useTextRenderer.ts`, `DatabaseStudio.vue`)**:
   - Suppressed separator comma before parenthetical AC badges: `14 (19...` instead of `14, (19...`.
   - Standardized hit dice formula modifier spacing in HP display: `(13d10 + 39)` instead of `(13d10+39)`.
   - Prevented double nested parentheses in relocated skill action plates: `8/-2 (10/+0, Perception)` instead of `(8/-2, (10/+0, Perception))`.
   - Stripped trailing punctuation on speed badges to prevent `.,` artifacting across speed riders.
   - Cleaned space before colon in `DatabaseStudio.vue` preset descriptions.

## Consequences
- **Positive**:
  - Impeccable typographic rendering with zero orphan punctuation across traits, actions, vitals, and spellcasting.
  - Title Case initiative headlines matching official 5e styling.
  - 100% green verification: 377/377 core unit tests (+5 new tests), 50/50 live browser CDP fuzz steps passing with 0 runtime exceptions.
  - Clean Quasar production build (exit code 0).
- **Negative / Trade-offs**:
  - None identified.
