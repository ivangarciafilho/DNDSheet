# ADR-0005: Vitals Alignment, Hit Die Shorthand, Layer Occlusion, and Defense Mirror Synchronization

## Status
Accepted - Delivered in Build 185 (2026-11-09)

## Context
During high-volume authoring and visual rendering of D&D 5e 2024 revised and classic statblocks, several visual and architectural divergences emerged across user workflows:
1. **Vitals Row & Badge Misalignment**:
   - Striped vs unstriped rows had asymmetric margins and paddings, causing the zebra-stripe background wash to bleed outside the vitals container or indent text inconsistently.
   - The empty languages badge (`—`) rendered outside the badge flex container, breaking horizontal alignment with the rest of the vitals column.
   - Senses entries with multiple items were joined by comma without space (`darkvision (60ft),blindsight (30ft)`).
   - Dark theme vitals labels suffered from low contrast against dark parchment washes in custom themes.
2. **Hit Die Lock and Dice Size Flexibility**:
   - The Hit Die type input (`HP.type`) was locked behind the automatic formula generator without direct access to die sizes (`d4`, `d6`, `d8`, `d10`, `d12`, `d20`), forcing users to compute formulas manually or struggle with disabled wrappers.
   - Shorthand display of hit dice (e.g., showing `d8` instead of verbose strings) was missing.
3. **A4 Composition Layer Occlusion**:
   - Layers in `A4LayerStudio.vue` with `blendMode: 'normal'` and 100% opacity did not occlude underlying layers if their PNG artwork contained transparent padding or required an opaque backing fill.
4. **Defense Module Ordering and Mirror Synchronization**:
   - When users swapped defense items in submodules (resistances, immunities, vulnerabilities, conditions), flat string mirror arrays (`resistances`, `immunities`, etc.) did not automatically sync, causing desynchronization in plaintext/markdown exports.
   - `conditionResistancesList` and `conditionVulnerabilitiesList` were missing from `SwappableField`.
5. **Multi-Column Trait Orphan & Frame Inset Balance**:
   - Multi-column trait layouts left empty vertical space under short traits due to unbalanced column fills and unconstrained break points.
   - Streamlined trait badges with `0px` flush borders collided visually with outer card borders; a harmonized `8px` inset was needed.

## Decision
1. **Vitals Uniformity & Dark Ink Contrast**:
   - Standardized all vitals rows (`.skill.dnd-cascade-panel`) to `padding: 1.5px 6px !important; margin: 1px -6px !important; border-radius: 3px !important;`.
   - Wrapped empty languages badge (`&mdash;`) inside `<div class="dnd-cascade-badges-wrap">`.
   - Joined senses with comma and space (`", "`).
   - Added high-contrast dark theme vitals ink CSS variables ensuring WCAG AAA (>7:1) and AA (>4.5:1) compliance.
2. **Interactive Hit Die Sizes**:
   - Added `Hit Die Sizes` option group (`d4 (Tiny)`, `d6 (Small)`, `d8 (Medium)`, `d10 (Large)`, `d12 (Huge)`, `d20 (Gargantuan)`) to `FormulaField.vue` when bound to `HP.type`.
   - Formatted shorthand display to show `d4`, `d6`, etc.
   - Unlocked formula field lock icon clickability with `pointer-events: auto !important` on disabled parents.
3. **Layer Solid Backing Fill**:
   - Added optional `backgroundColor?: string` to `A4CompositionLayer`.
   - Wired color picker and hex input in `A4LayerStudio.vue` under layer tuning controls.
   - Updated `getLayerStyle` in `WebRenderer.vue` to apply `backgroundColor` directly, providing full occlusion beneath transparent portions of layers.
4. **Defense Mirror Synchronization & Seeding**:
   - Expanded `SwappableField` union to include `conditionResistancesList` and `conditionVulnerabilitiesList`.
   - Updated `swapItems` in `monster-store.ts` to automatically synchronize corresponding flat string arrays on every swap.
   - Added bidirectional seeding and synchronization in `ResistancesEditor.vue`.
5. **Multi-Column Balance & Streamlined Trait Inset**:
   - Applied `column-fill: balance;` and `break-inside: avoid;` to traits and stats containers.
   - Standardized `.sb-plate.sb-trait-streamlined .sb-cell.sb-head` to have a clean 8px right margin (`margin: 1px 8px 1px 0; border: 1px solid var(--sb-rule); border-radius: 3px; padding: 2px 7px;`).
   - Ported decoupled domain utilities (`file-name.ts`, `asset-url.ts`, `guarded-storage.ts`, `subclass-spells.ts`, `HelpTip.vue`, `boot/help.ts`).

## Consequences
- **Positive**:
  - Pixel-perfect visual alignment and WCAG contrast across all themes and column layouts.
  - Fluid and intuitive Hit Die configuration with automatic HP preview updates.
  - Complete creative control over A4 composition layers with full occlusion capabilities.
  - Zero desync between UI cards and text/JSON export mirrors.
  - 372/372 core unit tests green; 50/50 live CDP browser fuzz tests passed with 0 runtime exceptions.
- **Negative / Trade-offs**:
  - `backgroundColor` on custom layers must be transparent by default to avoid unexpectedly obscuring lower layers unless explicitly set by the user.
