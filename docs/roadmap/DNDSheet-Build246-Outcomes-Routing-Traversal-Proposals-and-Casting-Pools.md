# Build 246 — Outcomes, Combat Routing, Traversal Riders, Proposals and Casting Pools

**Date:** 2026-11-14  
**Branch:** `build185-repairs` (`0c7ad22469f935f0de056a2a82057db6328928ec`)  
**Base Commit:** `3d90075` (Build 245)  
**GitHub Pages (`gh-pages`):** `e23b9fe29437ab20dddc8f7690c873bb1cebb18a`  
**Release Candidate Tag:** `rc-2.4.3-build-246-complete-outcomes-routing-traversal-proposals-and-casting-pools`  
**Production URL:** https://ivangarciafilho.github.io/DNDSheet/#/  

## Scope Delivered

Build 246 integrates five domain pillars on top of Build 245 formatting repairs while closing eight roadmap parent IDs (`A11.5`, `A11.7`, `A11.8`, `A11.9`, `A12.8`, `B3.6`, `B3.7`, `H11`) and sixteen Build 186 fine-grained verification items, plus recording core foundation progress under `A12.1` and `A12.2`:

1. **Outcomes, Random Tables & Attack Sign Grammar (`A11.5`, `A11.9`, `H11`)**
   - Added `RandomTable.explicitRollOnly`, normalized it in `normalizeRandomTables`, emitted `data-print-table="true"` and `data-explicit-roll-only` attributes on `.random-table-container` in `formatRandomTableAsHtml`, and enforced explicit-roll prompting (`Roll <dice> on <title> (explicit roll required)`) in `resolveTableOutcome` when `explicitRoll` is omitted (`src/core/domain/random-table.ts`).
   - Updated `plainValueText` and `formatNumber` in `src/core/domain/ability-grammar.ts` to route through `formatSignedModifier` so explicit or evaluated zero attack modifiers render as `+0` rather than unsigned `0`.
   - Updated `test/exhaustive-ui-fuzz.js` Step 50 (`Attack +0` / `Attack Roll: +0`) and Chrome teardown (`cleanupChrome`).

2. **Combat Activity Section Routing (`A11.7`)**
   - Added `CombatActivitySection`, `COMBAT_ACTIVITY_SECTIONS`, `CombatActivityRoutingEntry`, `CombatActivityRoutingState`, `RoutedSectionActivity`, `SECTION_ECONOMY_NORMALIZED` (ordering `Reactions` before `Traits`), `createCombatActivityRoutingState`, `formatSectionActivityTitle`, `relocateCombatActivity`, `undoCombatActivityRelocation`, `redoCombatActivityRelocation`, and `projectCombatActivitySections` in `src/core/domain/skill-action-groups.ts`.
   - Verifies single-copy section projection, reversible undo/redo state transitions, and non-redundant economy labels without losing mechanical facts (`test/core/SkillActionGroups.test.ts`).

3. **Compound Traversal Riders & Legacy Speed Migration (`A11.8`)**
   - Extended `SpeedActionRider` with `phaseStage`, `condition`, and `freeformFallback`, alongside `ParsedSpeedMovement`, `MigratedLegacySpeed`, `migrateLegacySpeedString`, and `composeMigratedSpeed` in `src/core/domain/speeds-traversal.ts` with round-trip and verbatim freeform tests (`test/core/SpeedsTraversal.test.ts`).

4. **Ability-Score & Species Proposals (`B3.6`, `B3.7`)**
   - Implemented deterministic seeded ability-score rolling and preview/apply/cancel/undo/revoke workflows in `src/core/domain/species-and-heuristics.ts` (`SeededAbilityRollResult`, `rollSeededAbilityScores`, `ProposalRuleset`, `ProposalFieldDiff`, `ProposalProvenance`, `AppliedGrantRecord`, `ProposalTargetMonster`, `MonsterProposal`, `ProposalApplyResult`, `proposeAbilityScores`, `proposeSpeciesGrants`, `cancelProposal`, `applyProposal`, `revokeSpeciesGrants`), preserving bound fields and post-apply user edits (`test/core/SpeciesAndHeuristics.test.ts`).

5. **Casting Sources, Pools, Subclass Progression & Print Proof (`A12.8`, `A12.1`/`A12.2` foundation, `A12.10 d`)**
   - Added `CasterProgressionType`, `CasterProgressionDefinition`, `CASTER_PROGRESSIONS`, `SubclassCatalogEntry`, `SubclassExpandedSpellPlan`, `SUBCLASS_EXPANDED_SPELLS`, `SUBCLASS_CATALOG`, `inferCasterProgression`, `planSubclassExpandedSpells`, `ComputedSpellMetricsResult`, `computeSpellMetrics`, `CastingPoolKind`, `PactSlotSummary`, `CastingSource`, `migrateCastingSources`, `ProjectedCastingSource`, `CastingProjection`, and `resolveCastingProjection` in `src/core/usecases/AutoSyncSpellcasting.ts` without colliding with `SRD_SUBCLASSES_BY_CLASS` / `getSubclassesForClass`.
   - Updated `src/core/usecases/MigrateMonsterSchema.ts` to trim and preserve `spellcasting.subclass`, `spellcasting.classes[].subclass` (backfilling index `0` from primary), and `spellcasting.multiclass.secondarySubclass` while retaining `spellGrants` and `legacy-secondary-casting-source` (`test/core/AutoSyncSpellcasting.test.ts`).
   - Added `@media print` CDP verification in `test/spell-plate-browser-smoke.js` confirming visible `.class-spellcasting.sb-plate` and `.innate-spellcasting.sb-plate` elements plus `(2), Level 1: Magic Missile`, `(1/Day), Level 3: Fireball`, and `3/Day ... Fireball`.

## Verification Evidence

- **Core unit & golden tests (`npm run test:core`)**: `635/635` pass, `0` fail (`test/core/AbilityGrammar.test.ts`, `test/core/AutoSyncSpellcasting.test.ts`, `test/core/RandomTableMigration.test.ts`, `test/core/SkillActionGroups.test.ts`, `test/core/SpeciesAndHeuristics.test.ts`, `test/core/SpeedsTraversal.test.ts`).
- **Lint (`npx eslint --ext .js,.ts,.vue src test`)**: `0` errors (`2767` warnings).
- **Typecheck (`npm run typecheck`)**: `505` diagnostics, `0` new, `178` resolved vs Build 213 (`e19a624`) baseline `683`.
- **Full Gate (`npm run gate`)**: `GATE PASSED: 10 steps` (`.gate/summary.json`, `"ok": true`, `inputFingerprint`: `4dd46883ff395cf86da4c66d5780070affe9dcb87e361e5eeac78c54e9d8384f`; timings: `core` 4s, `lint` 12s, `typecheck` 18s, `build` 38s, `fuzz` 180s, `help` 151s, `spell` 9s, `pages-build` 39s, `pages-assets` 0s, `pages-fuzz` 332s).
- **Publication (`node tools/publish.mjs --build 246 --slug complete-outcomes-routing-traversal-proposals-and-casting-pools --base 3d90075 --push`)**: Verified 101 SPA files + `release-candidate.json` (102 RC entries), built 103 `gh-pages` files at `e23b9fe29437ab20dddc8f7690c873bb1cebb18a`, pushed `build185-repairs`, `gh-pages`, and RC tag.

## Backlog & Groomed Next Queue

- **Before Build 246**: `264` unique IDs (`177` checked / `87` open); `313` raw checkboxes (`210` checked / `103` open).
- **After Build 246**: `264` unique IDs (`185` checked / `79` open, `+8 / -8`); `313` raw checkboxes (`234` checked / `79` open, `+24 / -24`: 8 parent closures + 16 Build 186 sub-items).
- **Next Queue (by dependency & precedence)**:
  1. `A13.9 f2 / g2` — sheet density PDF/pixel proof & design decision
  2. `H14` — per-file TypeScript diagnostic debt burn-down
  3. `A11.6` — reaction availability & trigger contracts
  4. `A12.9 / A12.10 a3` — source-based casting cards & i18n heading parity
  5. `A12.1–A12.4` — subclass catalog & computed spell metrics UI integration
