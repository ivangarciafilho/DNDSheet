# ADR-0003: Creator Quality-of-Life (QoL) Engine and Multi-Format Export Architecture

## Status
Accepted

## Date
2026-10-24

## Context
Monster creation in 5th Edition involves non-linear mathematical relationships between Challenge Rating (CR), Armor Class, Hit Dice, Attack Modifiers, Save DCs, and Damage Per Round (DPR). DM creators frequently struggle with:
1. **CR Drift & Rebalancing Overhead**: Manually adjusting an existing monster (e.g., scaling a CR 1/8 Kobold up to CR 3 or an Adult Dragon down to CR 5) requires tedious recalculations of hit points, proficiency bonuses, attack dice count, and damage thresholds across the DMG CR tables.
2. **Hidden Statblock Errors**: Deleting an action or attack often leaves orphan ID references in Multiattack definitions or causes multiattacks to become empty shells. Similarly, omitting damage types or mistyping stats creates silent export bugs.
3. **Platform Siloing**: Creators share monsters across Virtual Table Tops (VTTs like Foundry VTT), homebrew repositories (Markdown, Reddit, Homebrewery), and physical printouts. Exporting previously required manual copy-pasting or external conversion tools.

## Decision
We implement a decoupled, headless Creator QoL suite with reactive presentation components:

1. **CR Auto-Tuner (`src/core/usecases/AutoTuneCr.ts` & `src/components/cr/AutoTuneDialog.vue`)**:
   - Accepts any target CR (0 through 30).
   - Generates an `AutoTunePlan` detailing category adjustments (DEFENSE, OFFENSE, PROFICIENCY, STATS).
   - Dynamically recomputes Hit Dice (`HP.HD` and `HP.modifier = HD * CON_mod`) using the target HP tier midpoint and hit die size.
   - Adjusts Armor Class to the target DMG defensive tier.
   - Adjusts Proficiency bonus according to official tier advancement (+2 to +9).
   - Proportions attack damage dice (`atk.damage.count`) using the DPR ratio between current damage and target CR DPR midpoint.
   - Provides options to preserve core ability scores or selectively scale attacks.

2. **Statblock Linter & Health Diagnostic (`src/core/usecases/LintMonster.ts` & `src/components/cr/MonsterLintDialog.vue`)**:
   - Pure headless validation function `lintMonster(monster, spells)` returning structured issues (`code`, `severity`, `category`, `message`, `targetId`, `fixable`).
   - Checks multiattack referential integrity: detects and flags orphan attack IDs (`MULTIATTACK_ORPHAN_ATTACK`) and orphan action IDs (`MULTIATTACK_ORPHAN_ACTION`).
   - Detects missing damage types on attacks with non-zero damage count (`MISSING_DAMAGE_TYPE`).
   - Detects CR drift when selected printed CR diverges from calculated DMG CR by 2 or more steps (`CR_DRIFT`).
   - Detects spellcasting configuration anomalies (prepared standard spells with 0 assigned spell slots).
   - Provides 1-click self-healing via `autoFixMonster(monster)` removing stale orphan IDs and trimming empty multiattack sequences.

3. **Multi-Format Headless Exporter (`src/core/usecases/ExportStatblock.ts` & `src/components/file/DownloadButton.vue`)**:
   - `exportToMarkdown(monster, style)`: Generates clean, standard GitHub Flavored Markdown statblocks with full trait and action formatting.
   - `exportToPlainText(monster, style)`: Generates ASCII formatted, clipboard-ready text blocks.
   - `exportToHtml(monster, style)`: Generates semantic HTML snippets (`<div class="stat-block">`) with embedded styling.
   - `exportToFoundryJson(monster, style)`: Generates complete Foundry VTT Actor5e (`npc` type) JSON structures with items, attributes, details, and abilities ready for instant drag-and-drop import.

4. **Instant 2014 / 2024 Dual Ruleset Switcher (`src/layouts/MainLayout.vue`)**:
   - High-visibility header toolbar toggle button allowing 1-click switching between D&D 2014 and D&D 2024 statblock layouts without opening submenus.

## Consequences

### Positive
- **Instantaneous Rebalancing**: Creators can pivot monster challenge ratings in seconds with full mathematical parity to DMG guidelines.
- **Data Integrity**: Automated linting catches corruptions, broken multiattacks, and schema anomalies before exporting or sharing.
- **Cross-Ecosystem Interoperability**: Direct export to Foundry VTT Actor5e JSON, Markdown, and HTML eliminates external conversion steps.
- **Pure Core Isolation**: All tuning, linting, and export logic is completely headless and covered 100% by Node 22 native unit tests.

### Negative / Trade-offs
- Automatic DPR scaling scales damage count proportionally across all attacks; bespoke complex spells or multi-stage legendary actions may still require creator nuance.
