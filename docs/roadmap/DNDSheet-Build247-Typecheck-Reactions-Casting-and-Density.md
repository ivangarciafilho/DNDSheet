# Build 247 — Typecheck Debt, Reaction Availability, Casting Metrics & Sheet Density

**Date:** 2026-11-14  
**Branch:** `build185-repairs` (`62c7519ee24c8c64f5066956e4ec2b236b397656`)  
**Base Commit:** `ce5a7619ef9a349fd6df881b73d501e9a0db0afe` (Build 246)  
**GitHub Pages (`gh-pages`):** `aac4f4e3481cd05363f9add36b182cc6e6a6c37d`  
**Release Candidate Tag:** `rc-2.4.3-build-247-typecheck-reactions-casting-and-density`  
**Production URL:** https://ivangarciafilho.github.io/DNDSheet/#/  

## Scope Delivered

Build 247 delivers four cross-stack pillars across 57 files (`+1406 / -1712` lines), burning `src/` TypeScript diagnostics down to `0` (`48` total left only in third-party `node_modules`), completing reaction availability sets and action-family composer parity, wiring subclass catalogs/metrics/expanded-spell plans/cadence normalization into the spellcasting editor, and closing the final Build 186 `A13.9 f2/g2` sheet-density proofs. Eight roadmap parent IDs close (`A11.6`, `A12.1`, `A12.2`, `A12.4`, `A12.7`, `A13.9`, `B1.4`, `H14`), while honest progress is recorded on `A12.0` and `A12.9`:

1. **Canonical Type Ownership & Zero-Source Typecheck Burn-Down (`B1.4`, `H14`)**
   - `src/components/models.ts` now re-exports `export * from '../core/domain/types'` (`B1.4` single canonical owner in `src/core/domain/types.ts`).
   - Eliminated all remaining `src/` `vue-tsc` diagnostics (`683` Build 213 baseline -> `48` total / `635` resolved / `0` remaining in `src/`, leaving only upstream declarations in `node_modules/@vueuse/core`, `workbox-core`, `@types/node`, `@quasar/app-vite`, and `slugify`).
   - Fixed `useCr.ts`, `MonsterLintDialog.vue`, `CrFooter.vue`, `EncounterDynamicsEditor.vue` (replaced computed side effect with `watch` + pure `computed` for `vue/no-side-effects-in-computed-properties`), and `mathRendering.ts` (`saveForAction` optional `override?`) without touching `tools/typecheck-baseline.json`.

2. **Reaction Availability Sets, Predicates & Action-Family Parity (`A11.6`)**
   - Added `while_not_bloodied` in `src/core/domain/catalogs/cadence.ts`.
   - Added typed availability predicates (`REACTION_AVAILABILITY_PREDICATES`, `reactionPredicateLabel`, `reactionPredicateOptions`), multi-pool stage normalization and matching (`normalizeStagePools`, `sanitizeReactionAvailability`, `entryEffectiveStagePools`, `entryMatchesStagePool`, `formatReactionAvailability`, `reactionAvailabilityPatch`, `entryDisplayPatch`) in `src/core/domain/entry-display.ts`.
   - Updated `reaction-composer.ts` (`reactionChainView`, `reactionCellPatch`), `role-transition.ts`, `tarrasque-export.ts`, `monster-store.ts`, `MigrateMonsterSchema.ts`, `CalculateCr.ts` (opted-in reaction `crAnnotation` EHP/EAC modifiers), `ExportStatblock.ts`, `CrAnnotationCard.vue`, `ComposerChain.vue`, `ActionsEditor.vue`, `EntryDisplaySettings.vue`, `statblock-help.ts`, `useTextRenderer.ts`, `useProcessTokens.ts`, and `statblock-grammar.scss`.
   - Verified in `test/core/EntryDisplay.test.ts`, `test/core/ReactionComposer.test.ts`, `test/core/MigrateMonsterSchema.test.ts`, `test/core/RoleTransition.test.ts`, and `test/core/CalculateCr.test.ts`.

3. **Spellcasting Metrics, Subclass Catalogs, Expanded Grants & Honest Error States (`A12.1`, `A12.2`, `A12.4`, `A12.7`; `A12.0`/`A12.9` progress)**
   - Added `cadenceKey` in `src/core/domain/catalogs/cadence.ts`; added `resolveDefaultStatForClass`, `resolveSubclassExpandedSpellKey`, `getCatalogSubclassesForClass`, `source: 'SRD 5.1 / 5.2'` / `hasExpandedSpells` on `SubclassCatalogEntry`, and explicit `'unavailable'` handling in `computeSpellMetrics` for unknown classes (`src/core/usecases/AutoSyncSpellcasting.ts`).
   - Wired `ClassCastingEditor.vue` and `CastingSourceSpellRows.vue` to consume `castingClassOptions`, `getCatalogSubclassesForClass`, `CADENCE_OPTIONS` + `cadenceKey`, `[data-source-metrics]` / `[data-source-metrics-error]` (`role="alert"`) / `'—'` `autoValue` via `computeSpellMetrics`, `[data-source-over-limit]` warning banner, and `[data-subclass-expanded-plan]` apply/remove controls (`applyExpandedSpells`, `removeExpandedSpells`) backed by `planSubclassExpandedSpells` and `spellGrants`.
   - Verified in `test/core/AutoSyncSpellcasting.test.ts` and `test/shared-casting-editor-browser-smoke.js` (`fiendChecks` over-limit banner + Fiend Patron expanded grants apply/reload/remove, `proficiency = -1` metrics error banner + `'—'` auto fallback).
   - **Honest open boundary (`A12.0`, `A12.9`, `A12.10`)**: `sourceCapacityReference` still uses `"Legacy base-class capacity"` (`BS-29`) and Metamagic / Sorcery Points remain top-level (`spellcasting.metamagic`) rather than per-source, so `A12.0`, `A12.9`, and `A12.10` remain open until ruleset-specific capacity tables and per-source resource ownership finish.

4. **Sheet Density & Print Parity (`A13.9`, resolving `f2` & `g2`)**
   - **`A13.9 g2`**: Parameterized `--sb-top-plate-bg`, `--sb-top-plate-adv-ink`, and `--sb-top-plate-disadv-ink` directly inside `@mixin plate-palette(...)` in `src/css/statblock-grammar.scss` (`theme-printer` monochrome `#000000`, all other 11 themes `#1d6b29` / `#a8211a` on `#ffffff` nameplate panel), removing the `:not(.theme-printer)` override hack while keeping 12-theme ≥ 4.5:1 contrast verified in `statblock-help-browser-smoke.js`.
   - **`A13.9 f2`**: Updated `test/statblock-help-browser-smoke.js` to enable `{ showBloodied: true, bloodiedSource: 'half_hp' }` during CDP `@media print` so `printProbe.reds > 0` (`reds: 1, notRed: []`) is non-vacuous before restoring state, and extended `test/print-parity-browser-smoke.js` to assert classic vs modern A4 PNG pixel dimension parity and single-page classic A4 `Page.printToPDF` `MediaBox`.

## Verification Evidence

- **Core unit & golden tests (`npm run test:core`)**: `642/642` pass, `0` fail (`+7` vs Build 246 `635`: `AutoSyncSpellcasting.test.ts`, `CalculateCr.test.ts`, `EntryDisplay.test.ts`, `MigrateMonsterSchema.test.ts`, `ReactionComposer.test.ts`, `RoleTransition.test.ts`, `LintMonster.test.ts`).
- **Lint (`npx eslint --ext .js,.ts,.vue src test`)**: `0` errors (`2784` warnings).
- **Typecheck (`npm run typecheck`)**: `48` diagnostics (all in `node_modules/`, `0` in `src/`), `0` new, `635` resolved vs Build 213 (`e19a624`) baseline `683`.
- **Full Gate (`npm run gate`)**: `GATE PASSED: 10 steps` (`.gate/summary.json`, `"ok": true`, `inputFingerprint`: `c2541357ab7c8456facfa0e83f435a65ddabf33b370dd1c96b595405ec0ab5b1`; timings: `core` 5s, `lint` 32s, `typecheck` 56s, `build` 74s, `fuzz` 197s, `help` 144s, `spell` 9s, `pages-build` 66s, `pages-assets` 0s, `pages-fuzz` 310s).
- **Gate Browser Receipts**:
  - `.gate/help.log`: `Print probe: {"media":true,"count":14,"light":[],"reds":1,"notRed":[]}`, `Statblock UI smoke passed: shared row grammar, 12 theme contrast probes, hover/focus help, viewport repositioning, Escape, detached-target cleanup`, `Release matrix passed: 5 shared fixtures × 12 themes; 120 computed head/body contrast samples`, `Fit inventory: 10 views, 0 clipping observations; report .gate/fit.json`.
  - `.gate/pages-fuzz.log`: `"fiendChecks":{"overLimit":"Over limit: 3 / 2 cantrips (+1 over).","grantCount":4}`, `"afterRemoveAndError":{"removed":true,"errText":"Pact Magic · Metrics error: Invalid proficiency bonus: -1","autoDash":true}`, classic vs modern `A4 print parity`, and 58/58 SPA & Pages exhaustive steps with 0 runtime exceptions.
- **Publication (`node tools/publish.mjs --build 247 --slug typecheck-reactions-casting-and-density --base ce5a761 --push`)**: Verified 101 SPA files + `release-candidate.json` (102 RC entries), built 103 `gh-pages` files at `aac4f4e3481cd05363f9add36b182cc6e6a6c37d`, pushed `build185-repairs`, `gh-pages`, and RC tag `rc-2.4.3-build-247-typecheck-reactions-casting-and-density`.

## Backlog & Groomed Next Queue

- **Before Build 247**: `264` unique IDs (`185` checked / `79` open); `313` raw checkboxes (`234` checked / `79` open).
- **After Build 247**: `264` unique IDs (`193` checked / `71` open, `+8 / -8`); `313` raw checkboxes (`242` checked / `71` open, `+8 / -8`: `A11.6`, `A12.1`, `A12.2`, `A12.4`, `A12.7`, `A13.9`, `B1.4`, `H14`, plus Build 186 `A13.9 f2/g2` inline resolutions).
- **Next Queue (by dependency & precedence)**:
  1. `A12.0` -> `A12.9` -> `A12.10` — 2014 vs 2024 ruleset-aware cantrip/prepared capacity tables (`BS-29`) & per-source sorcery points / compact spell list parity
  2. `A9.7` / `A9.10` / `A9.13` -> `A11.2–A11.4` — remaining `FormulaField` bindings (`BasicsEditor` + roll-count/scaling/conditional rolls) & option-array audit
  3. `A13.1–A13.7` + `H9` -> `A14.1–A14.6` — `CatalogSelect` interaction kit + shared enum catalogs + purpose-led help copy -> split `BasicsEditor.vue`
  4. `B1.1–B1.3`, `B1.5` -> `B2` / `B4` / `B5` — Track B envelope/revision/repair/export/storage chain unblocked by `B1.4`
