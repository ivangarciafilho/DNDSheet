# ADR-0003: Basics Decomposition, Interaction Kit, and CSS Grammar

- Status: Accepted (Build 250 / v2.5.0)
- Date: 2026-11-14
- Owners: Ivan Garcia Filho / DNDSheet engineering
- Supersedes / Follows: Track A refactorings A10–A17 (`docs/roadmap/DNDSheet-Implementation-Backlog.md`)

## Context

Prior to Track A Sweep 1–4 (Builds 245–250):
1. `src/components/editor/BasicsEditor.vue` had grown to 4,445 lines combining identity, abilities, AC compositing, paragon phases, hit points, and lore into a single monolithic component.
2. Editor dropdowns used ad-hoc `<q-select>` markup with inconsistent search behavior, missing keyboard semantics, custom-value drift, and un-tracked help-tip coverage across editor panels (`test/inventory.mjs`).
3. `src/css/app.scss` carried 505 `!important` declarations competing with Quasar utility rules and Stat Block rendering surfaces (`#render`, `.composer-preview`, A4 print export).

## Decision

1. **Domain-Scoped Section Decomposition (`BasicsEditor`)**
   - `BasicsEditor.vue` is reduced to a 31-line section host providing `provideBasicsContext()` and rendering six cohesive subsection modules under `src/components/editor/basics/`:
     - `IdentitySection.vue` (378 lines)
     - `AbilitiesSection.vue` (91 lines)
     - `DefensesSection.vue` (524 lines)
     - `ParagonSection.vue` (387 lines)
     - `HitPointsSection.vue` (860 lines)
     - `LoreSection.vue` (914 lines)
   - Shared reactive bindings, catalog lists, and computed helpers live in `useBasicsContext.ts` (1,012 lines) and `basics-catalogs.ts` (643 lines), preserving single-source `monster-store` state without duplicate mutations.

2. **Canonical Interaction Kit & 100% Help Floor**
   - Standard catalog pickers use `src/components/kit/CatalogSelect.vue` backed by `src/core/domain/catalogs/catalog-select-model.ts` (with hoisted `Intl.Collator` sorting for sub-millisecond filtering across 450+ entries), alongside `FormulaField.vue`, `useBindings.ts`, and `HelpTip.vue`.
   - Ad-hoc `<q-select>` controls are restricted to documented exemptions (multi-select chip tables, async remote search, rich-text display buttons, custom grouped popups, or compact 3–5 item inline table state pickers) recorded in `docs/roadmap/DNDSheet-Control-Inventory.md`.
   - `test/audit-help.mjs` and `test/core/Budgets.test.ts` enforce the `100.0 %` (`554 / 554`) editor help-tip coverage floor across `src/**/*.vue`.

3. **Explicit Statblock CSS Ownership & `!important` Containment**
   - Statblock typography, cellular tables, parchment rules, and 2024/classic visual templates live in `src/css/statblock-grammar.scss` scoped under `:is(#render, .composer-preview, body)` rather than leaking global utility overrides into `src/css/app.scss`.
   - `src/css/app.scss` is reduced from 505 `!important` declarations to `44` (91.3% reduction), enforced by `test/core/Budgets.test.ts` (`< 150` ceiling).

## Consequences

- `BasicsEditor` panels and kit controls can evolve and be unit/browser-tested independently (`test/core/BasicsPanelSplit.test.ts`, `test/core/CatalogKit.test.ts`, `test/build250-workflow-browser-smoke.js`).
- Any new `<q-select>` outside `src/components/kit/` must either adopt `CatalogSelect` or document its exemption in `docs/roadmap/DNDSheet-Control-Inventory.md`.
- Future `Track C` decomposition candidates with >1,000 lines (`A4LayerStudio.vue` 1,544, `SkillsEditor.vue` 1,397, `ResistancesEditor.vue` 1,138, `ActionsEditor.vue` 1,034) follow this same `provide*Context` + subsection module pattern.
