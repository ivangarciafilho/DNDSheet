# ADR-0004: Streamlined Plate Grammar, Radial Offset & Dual-Knob Cropping Controls, and Decoupled Vitals Architecture

## Status
Accepted

## Date
2026-11-09

## Context
Across Builds 180 to 184, user feedback and rigorous visual audits identified several structural and ergonomic gaps in the statblock presentation and studio authoring environments:

1. **Trait & Action Plate Wasted Space & Alignment**: In previous CSS implementations, `.sb-plate` cells either reserved an entire vertical column beneath the `.sb-head` badge (leaving wasted whitespace underneath the trait title when descriptions wrapped over multiple lines) or had margin offsets that prevented trait and action badges from sitting `0px` flush against the plate frame borders.
2. **Layer Studio Ergonomics & Occlusion Gaps**: Custom layers added in `A4LayerStudio.vue` with `blendMode: 'normal'` and 100% opacity did not occlude background layers due to rigid z-index rules and lack of stacking isolation. Furthermore, 24-bit opaque PNG/JPG assets imported for frame or background masking failed to mask via CSS `-webkit-mask-image` in Chromium without a dedicated luminance-to-alpha filter. Additionally, standalone X/Y numeric inputs and separate edge cropping sliders created visual clutter and lacked intuitive visual resets.
3. **Vitals Coupling & Single-Line Congestion**: Speeds, Armor Class, and Hit Points riders (Bloodied, Temporary HP, Regeneration, Damage Threshold, Damage Reduction, Attacker Saves, Death Prevention) were tightly coupled in monolithic formatting routines, causing mutual exclusion bugs (e.g. Temp HP hiding Regeneration) and unreadable horizontal line clutter.
4. **Ability Score & Save Table Collisions**: Under narrow 2-column card layouts, ability score tables (`.dnd-stats-2024 .stat-table`) squeezed modifier numbers and clipped advantage/disadvantage indicator arrows (`DEX 18 | +4 | +6 ▲▲`).
5. **Spell-Like Trait & Action Plate Inconsistency**: Spell-like traits and actions (`Exorcise`, `Astral Binding`) rendered duration, scope, mechanics, and outcomes in an inconsistent sequence compared to the Composer's logical hierarchy (`Head + Mechanics` -> `Targets/Scope` -> `Outcomes`).

## Decision

We adopt a comprehensive, decoupled architectural evolution across the domain, rendering, and editor layers:

### 1. Streamlined Plate Grammar (`.sb-plate.sb-trait-streamlined` & `.sb-single-line`)
- **Flush Borders**: All `.sb-head` cells across `.sb-plate` and `.sb-plate.sb-trait-streamlined` sit `0px` flush against the top and left borders of their frame (`float: left; margin: -3px 8px 1px -8px; padding: 3px 8px; border-right: 1px solid var(--sb-rule); border-bottom: 1px solid var(--sb-rule); border-radius: 0 0 3px 0`).
- **Multi-Line Wrapping**: Multi-line traits (`Arcane Condenser`, `Cortex`) float their `.sb-head` badge on line 1 while line 2+ of `.sb-desc-inline` wraps directly underneath the badge across the full width of the plate (`margin-left: 0`).
- **Single-Line Stretching**: Short single-line traits and actions (`Heavy Metal`, `Multiattack`) use `.sb-single-line` (`display: flex; align-items: stretch; margin: -3px 8px -3px -8px; border-bottom: 0`) so the badge stretches `0px` flush from top to bottom, perfectly matching standard single-row action plates (`Search`, `Study`, `Influence`, `Hide`).

### 2. Composer-Aligned Spell-Like Plate Row Ordering
- In `src/components/rendering/useProcessTokens.ts` (`buildPlateEntry`), spell-like traits and actions (`isSpellLike`) strictly structure their plates into 3 hierarchical rows matching the Composer UI:
  - **Row 1**: `Head + Duration + Mechanics` (e.g. `| 8th Level Arcane Caster (CHA) | 1 round | Spell Save DC 14 · Spell Attack +6 |`).
  - **Row 2**: `Targets & Scope` (e.g. `| enemies 20 ft. of you across the Ethereal and Material Planes |`).
  - **Row 3**: `Outcomes & Body` (e.g. `| Hit: ... / On Failure: ... |`).

### 3. Integrated Radial Offset & Parallel Dual-Knob Cropping Controllers
- Consolidated all layer positioning and cropping into `RadialOffsetController.vue` and `DualKnobCropSlider.vue`:
  - Current X, Y, and crop percentages are rendered **inside the draggable knobs**.
  - Double-clicking any knob opens an inline numeric input for exact manual entry.
  - Parallel dual-knob sliders for `Crop X` (horizontal) and `Crop Y` (vertical) are mounted alongside the radar pad and offset tracks.
  - Dedicated reset buttons (`restart_alt`) are provided for individual offset axes (`resetX`, `resetY`) and individual cropping bounds (`resetCropXMin`, `resetCropXMax`, `resetCropYMin`, `resetCropYMax`). Duplicate standalone edge sliders in `A4LayerStudio.vue` are eliminated.

### 4. Hardware SVG Luminance-to-Alpha Masking & Dynamic Layer Occlusion
- `WebRenderer.vue` mounts hardware SVG `<filter>` elements (`#a4-luminance-to-alpha` and `#a4-luminance-to-alpha-invert`) calculating alpha via the W3C luminance matrix ($A' = 0.2126 R + 0.7152 G + 0.0722 B$).
- Composition layers inside `.a4-page-sheet` use `isolation: isolate` with `.statblock-wrapper { z-index: auto }` and descending dynamic z-indices (`zIndex = (total - idx) * 10 + 10`), ensuring `mix-blend-mode: normal` layers at 100% opacity properly occlude statblocks and lower layers.

### 5. Decoupled Vitals & Contextual Sub-Rows (`↳`)
- Created decoupled domain composers:
  - `src/core/domain/hp-defense-composer.ts`
  - `src/core/domain/ac-defense-composer.ts`
  - `src/core/domain/speeds-traversal.ts`
  - `src/core/domain/initiative-composer.ts`
- Base stats remain on the primary vitals line; conditional riders (Bloodied, Temp HP, Regeneration, DT, DR, Locomotion traversal riders, AC attacker save/on miss riders) emit as independent badges on dedicated indented sub-rows (`.dnd-vitals-indented-subrow`, `↳`).
- Contextual `↳ Sub-Row` toggles are placed directly inside the AC Decoupled Riders bar and inside each HP Rider module header in `BasicsEditor.vue`.

### 6. Auto-Balanced Ability Score, Modifier & Save Grid
- Rebalanced `.dnd-stats-2024 .stat-table` and `.statblock.modern-modular .stat-table` grid column tracks (`minmax(22px, 0.82fr) minmax(16px, 0.60fr) minmax(20px, 0.72fr) minmax(38px, 1.66fr)`) and compact arrow glyphs (`font-size: 0.62em; letter-spacing: -1.5px`) so ability scores with double advantage/disadvantage arrows (`DEX 18 | +4 | +6 ▲▲`) never collide or truncate in 2-column layouts.

### 7. Categorized, Alphabetically Ordered, Color-Coded, Tooltipped Catalogs
- Enhanced `ChainCell.vue`, `action-composer.ts`, and `BasicsEditor.vue` dropdowns with:
  - Grouped category headers.
  - Alphabetical ordering within categories.
  - Material icons and semantic color badges.
  - Hover `<q-tooltip>` explaining mechanics, durations, and scopes.

## Consequences

### Positive
- **Visual Polish & Zero Gaps**: All trait badges sit flush against frame borders with zero awkward margins or reserved blank columns.
- **Superior Ergonomics**: Creators adjust positioning, cropping, and tension with visual feedback directly inside knobs and one-click resets.
- **Accurate Rules Representation**: Complex D&D 5e / 2024 vitals, spellcasting structures, and multi-phase Paragon mechanics are represented cleanly without formula corruption or line collision.
- **Robust Verification**: 361/361 core unit tests pass, 50/50 live browser CDP fuzz tests pass with 0 runtime exceptions, and production builds compile cleanly.

### Negative / Trade-offs
- Floating badges on multi-line traits require strict CSS clearing and parent clearfix boundaries to ensure following plates do not overlap.
- High-resolution SVG filter masking slightly increases GPU composite workload on low-end mobile devices during continuous layer transforms.
