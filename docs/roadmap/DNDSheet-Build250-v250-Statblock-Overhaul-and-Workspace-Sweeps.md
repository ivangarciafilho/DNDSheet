# DNDSheet Build 250 — v2.5.0 Statblock Overhaul & Workspace Sweeps

- **Release:** Build 250 (`v2.5.0-statblock`)
- **Date:** 2026-11-14
- **Branch:** `build185-repairs`
- **Source Commit:** `f7219a79de85725e608280629929ac2a0432e6ef` (on parent `f49b807573be1c2532a1a6c42c0a1e9e77862745`, extending Build 249 `01a9ba94d64a0e26c1904b2926a8f29bb8cc09ae`)
- **Pages Commit:** `87c24f4426210d274471e56559c4d15fb41b869a` (`gh-pages`, `104` files)
- **Tags:** `v2.5.0-statblock`, `rc-2.4.3-build-250-v250-statblock-overhaul-and-workspace-sweeps`
- **Production URL:** https://ivangarciafilho.github.io/DNDSheet/#/
- **Receipt:** [Publication Receipt](DNDSheet-Build250-Publication-Receipt.json)
- **Architecture Decision:** [ADR-0003](../decisions/ADR-0003-Basics-Decomposition-Interaction-Kit-and-CSS-Grammar.md)

## Scope Delivered (`20` tasks closed; all executable Track A & Track B engineering work complete)

1. **Wave 1 — `A14.1`–`A14.6` (`09a33fa`): `BasicsEditor` 6-Panel Decomposition & Kit Adoption**
   - Split monolithic `BasicsEditor.vue` (4,445 LOC) into a `31`-line host + `useBasicsContext.ts` (1,012 LOC) + `basics-catalogs.ts` (643 LOC) + six focused section panels under `src/components/editor/basics/`: `IdentitySection.vue` (378 LOC), `AbilitiesSection.vue` (91 LOC), `DefensesSection.vue` (524 LOC), `ParagonSection.vue` (387 LOC), `HitPointsSection.vue` (860 LOC), and `LoreSection.vue` (914 LOC).
   - Adopted `CatalogSelect` and `100%` `v-help` coverage across all six panels (`test/core/BasicsPanelSplit.test.ts`).

2. **Wave 2 — `A15.1`–`A15.6` (`47088bd`): Casting, Checks, Senses & Defenses Sweeps**
   - Adopted `CatalogSelect`, responsive grid fit, keyboard focus rules, and `100%` help tips across `ClassCastingEditor.vue`, `SpellcastingEditor.vue`, `AtWillCastingEditor.vue`, `SkillsEditor.vue`, `SavesEditor.vue`, `SensesEditor.vue`, `SpeedsEditor.vue`, `ResistancesEditor.vue`, and `InventoryEditor.vue`.

3. **Wave 3 — `A16.1`–`A16.3`, `A16.5`–`A16.7` (`42e6eb1`): Studio, A4 Composition, Toolbar & CSS Grammar Pruning**
   - Adopted kit controls and help tips across Actions Studio / composer chain components, `A4LayerStudio.vue` (`.editor-scroll-region[data-a4-layer-list]`, `BS-35`), `MainLayout.vue` toolbar, `RegionalEffectsEditor.vue`, `AnatomyEditor.vue`, `EncounterDynamicsEditor.vue`, and `VillainActionsEditor.vue`.
   - Pruned legacy statblock CSS from `src/css/app.scss`, cutting `!important` declarations from `505` down to `44` (`91.3%` reduction, well below the `< 150` ceiling), while keeping explicit surface styles isolated in `src/css/statblock-grammar.scss` (`258` scoped rules).
   - Elevated global editor help-tip coverage to `100.0 %` (`554 / 554`, `floor: 100 %`) with explicit `CatalogSelect` Exemption Registry documented in [Control Inventory](DNDSheet-Control-Inventory.md).

4. **Wave 4 & Release Hardening — `A17.5`, `A17.9` (`465e923`, `a183b5f`, `f49b807`, `f7219a7`)**
   - Hoisted `ALPHA_COLLATOR` (`Intl.Collator`) in `src/core/domain/catalogs/catalog-select-model.ts` (`450`-option filter/sort `568.2 ms` -> `21.5 ms`) and cached `FormulaContext` in `src/core/domain/monster-bindings.ts` (`67` bindings median `3.17 ms` dirty / `1.98 ms` steady).
   - Added automated budget enforcement (`test/core/Budgets.test.ts`), CDP browser budget probe (`test/budget-browser-probe.js`), and Build 250 E2E workflow smoke (`test/build250-workflow-browser-smoke.js`) to `test/gate.mjs`.
   - Bound local gate HTTP test origins directly to `127.0.0.1` (`test/gate.mjs`), extended CDP command timeout to `45000 ms` (`tools/qa/browser-probe.mjs`), and updated `reloadApp()` (`test/exhaustive-ui-fuzz.js`) to await async `MainLayout` + builder chunk mount cleanly.

## Verification & Live Parity

- **10-Step Gate (`npm run gate`):** `GATE PASSED: 10 steps` (`inputFingerprint`: `8b7355ffeb9632b131745f73bb5333e1c117f7e365cfb5f03a308a622efece46`).
  - `core` (`4 s`): **`678 / 678` pass** (`666` subtests, `0` fail).
  - `lint` (`18 s`): **`0` errors** (`2,740` warnings).
  - `typecheck` (`30 s`): **`48` diagnostics; `0` new; `635` resolved** (approved baseline `683`, Build 213 `e19a624`; `0` in `src/`).
  - `build` (`39 s`), `pages-build` (`46 s`), `pages-assets` (`0 s`): clean (`dist/spa` max JS `933,799` bytes, max CSS `670,511` bytes).
  - `fuzz` (`194 s`), `pages-fuzz` (`372 s`): `ALL 58 EXHAUSTIVE UI STEPS PASSED WITH 0 ERRORS` (`RUNTIME EXCEPTIONS DETECTED: 0`).
  - `help` (`186 s`), `spell` (`9 s`): `npm run audit:help` `554 / 554 (100.0 %)`, `overflow-probe` `0` clips across `10` views, `budget-browser-probe` (`keystrokeP95Ms: 10.4`, `completionOpenMs: 29.1`, `catalogSelectOpenMs: 8.9`, `headContrast: 12.11`), and `build250-workflow-browser-smoke` (`15` panels, `6` Basics sections, CR `0`/`15` PB sync, `16`-Tab traversal + `Celestial` keyboard select, `ClassCasting` kit selects, `A4LayerStudio` scroll containment, `1440`/`640`/`390px` zero overflow).
- **Live GitHub Pages Parity (`https://ivangarciafilho.github.io/DNDSheet/`):** HTTP `200` and exact byte-for-byte SHA-256 match across `index.html`, `assets/index.bc17d5db.js`, `assets/index.88360bf2.css`, and `assets/MonsterBuilder.df8ff7b1.js`.

## Remaining Queue

- **Owner Gates Only (`2 / 313` raw checkboxes; `2 / 269` `count-tasks` IDs):** `B5.7` (`ErrorCorrection.vue` `/reset` scope) and `H16` (`F:\AI_Resources\DNDSheet-RC\` cleanup).
- **Forward Enhancements (`Track C · v2.6+`):** Logged in [Implementation Backlog](DNDSheet-Implementation-Backlog.md#track-c--v26-forward-roadmap-post-v250-backlog-grooming) (`C1`–`C7`, starting with decomposing `A4LayerStudio.vue` 1,544 LOC / `SkillsEditor.vue` 1,397 LOC / `ResistancesEditor.vue` 1,138 LOC / `ActionsEditor.vue` 1,034 LOC).
